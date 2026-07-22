import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export const VUE_ANT_RUNTIME = "vue-ant";
export const VUE_ANT_RENDERER_VERSION = 2;
export const SUPPORTED_CAPABILITIES = {
  form: new Set([
    "form.simple",
    "form.steps",
    "form.groups",
    "form.sideIllustration",
    "form.stickyActions",
    "form.modeTabs",
    "form.upload",
    "form.reviewTable",
    "form.uploadFlow"
  ]),
  list: new Set([
    "query.basic",
    "query.advanced",
    "query.dateRange",
    "query.quickRanges",
    "summary.count",
    "summary.amount",
    "statistics.cards",
    "statistics.cards.rich",
    "table.toolbar",
    "table.flat",
    "table.pagination",
    "table.link",
    "table.tags",
    "table.status",
    "table.amount",
    "table.fixedActions",
    "table.confirmAction",
    "table.selection",
    "table.batchActions",
    "table.expandable",
    "table.export",
    "table.refresh",
    "table.columnSettings",
    "list.workflow.createDrawer",
    "list.workflow.detailDrawer"
  ]),
  detail: new Set([
    "detail.quickView",
    "detail.groups",
    "detail.anchors",
    "detail.sectionTabs",
    "detail.metrics",
    "detail.embeddedTable",
    "detail.actions"
  ]),
  result: new Set([
    "result.basic",
    "result.summary",
    "result.feedback"
  ])
};

export const FORM_TEMPLATE_DEFINITIONS = Object.freeze({
  "form.single-stage": Object.freeze({ label: "单阶段信息收集表单" }),
  "form.grouped-configuration": Object.freeze({ label: "分组配置表单" }),
  "form.staged-configuration": Object.freeze({ label: "分阶段配置表单" }),
  "form.import-review-flow": Object.freeze({ label: "导入复核流程表单" })
});
export const FORM_TEMPLATE_IDS = Object.freeze(Object.keys(FORM_TEMPLATE_DEFINITIONS));

const FORM_CONTROLS = ["static", "input", "select", "radio", "upload"];
const FORM_ACTION_PLACEMENTS = ["control-start", "sticky-end"];
const FORM_FIELD_LAYOUTS = ["single-column", "multi-column"];
const FORM_GRID_COLUMNS = [2, 3, 4];
const FORM_STEP_STATUSES = ["wait", "process", "finish", "error"];
const FORM_REVIEW_COLUMN_FORMATS = ["text", "datetime", "amount"];
const LIST_QUERY_CONTROLS = ["input", "select", "date-range"];
const LIST_COLUMN_FORMATS = ["text", "link", "tag", "status", "amount", "datetime"];
const QUICK_RANGE_KEYS = ["today", "yesterday", "last3days", "last7days", "last30days"];
const TABLE_TOOLS = ["export", "refresh", "settings"];
const LIST_SUMMARY_TYPES = ["count", "active", "sum", "value"];
const STATISTICS_LAYOUTS = ["standard", "rich"];
const STATISTIC_FORMATS = ["amount", "number"];
const STATISTIC_AGGREGATE_OPERATIONS = ["sum", "count"];
const TABLE_SELECTION_MODES = ["multiple"];
const TABLE_SELECTION_QUICK_ACTIONS = ["all-results", "current-page", "invert-current-page", "clear"];
const TABLE_EXPANDABLE_MODES = ["multiple"];
const DETAIL_PRESENTATIONS = ["page", "modal", "drawer"];
const RESULT_PRESENTATIONS = ["page", "inline-state"];
const DETAIL_FIELD_FORMATS = ["text", "status", "amount", "datetime"];
const DETAIL_FIELD_SPANS = [1, 2, 3, "full"];
const DETAIL_STATUS_TONES = ["default", "success", "error", "warning", "processing"];
const DETAIL_TABLE_COLUMN_FORMATS = ["text", "status", "amount", "datetime"];
const RESULT_STATUSES = ["success", "error", "warning", "processing"];

export function readYamlPageSpec(file) {
  return YAML.parse(fs.readFileSync(file, "utf8"));
}

function issue(errors, condition, message) {
  if (!condition) errors.push(message);
}

function validateField(errors, field, location, controls) {
  issue(errors, field && typeof field === "object", `${location} must be an object.`);
  if (!field || typeof field !== "object") return;
  issue(errors, typeof field.key === "string" && field.key.length > 0, `${location}.key is required.`);
  issue(errors, typeof field.label === "string" && field.label.length > 0, `${location}.label is required.`);
  issue(errors, controls.includes(field.control), `${location}.control must be one of: ${controls.join(", ")}.`);
  if (["select", "radio"].includes(field.control)) {
    issue(errors, Array.isArray(field.options) && field.options.length > 0, `${location}.options is required for ${field.control}.`);
  }
  if (field.control === "upload") {
    if (field.accept !== undefined) {
      issue(errors, Array.isArray(field.accept) && field.accept.length > 0, `${location}.accept must be a non-empty array when supplied.`);
      if ((field.accept || []).some((item) => typeof item !== "string" || !item.length)) {
        errors.push(`${location}.accept must contain file extension strings.`);
      }
    }
    if (field.maxCount !== undefined && (!Number.isInteger(field.maxCount) || field.maxCount < 1)) {
      errors.push(`${location}.maxCount must be a positive integer when supplied.`);
    }
    if (field.buttonLabel !== undefined && (typeof field.buttonLabel !== "string" || !field.buttonLabel.length)) {
      errors.push(`${location}.buttonLabel must be non-empty text when supplied.`);
    }
    if (field.templateAction !== undefined) validateAction(errors, field.templateAction, `${location}.templateAction`);
  }
}

function validateAction(errors, action, location) {
  issue(errors, action && typeof action === "object", `${location} must be an object.`);
  if (!action || typeof action !== "object") return;
  issue(errors, typeof action.key === "string" && action.key.length > 0, `${location}.key is required.`);
  issue(errors, typeof action.label === "string" && action.label.length > 0, `${location}.label is required.`);
  if (action.confirm !== undefined && typeof action.confirm !== "string") {
    errors.push(`${location}.confirm must be text when supplied.`);
  }
  if (action.danger !== undefined && typeof action.danger !== "boolean") {
    errors.push(`${location}.danger must be a boolean when supplied.`);
  }
}

function usesCapability(errors, capabilities, condition, capability, message) {
  if (condition && !capabilities.includes(capability)) errors.push(message || `${capability} capability is required.`);
  if (!condition && capabilities.includes(capability)) errors.push(`${capability} is declared but not used by this Page Spec.`);
}

function validateStatisticAggregate(errors, aggregate, location) {
  issue(errors, aggregate && typeof aggregate === "object", `${location} must be an object.`);
  if (!aggregate || typeof aggregate !== "object") return;
  issue(errors, STATISTIC_AGGREGATE_OPERATIONS.includes(aggregate.op), `${location}.op must be one of: ${STATISTIC_AGGREGATE_OPERATIONS.join(", ")}.`);
  if (aggregate.op === "sum") {
    issue(errors, typeof aggregate.field === "string" && aggregate.field.length > 0, `${location}.field is required for sum.`);
  }
  if (aggregate.field !== undefined && (typeof aggregate.field !== "string" || !aggregate.field.length)) {
    errors.push(`${location}.field must be text when supplied.`);
  }
  if (aggregate.where !== undefined) {
    issue(errors, aggregate.where && typeof aggregate.where === "object", `${location}.where must be an object.`);
    issue(errors, typeof aggregate.where?.field === "string" && aggregate.where.field.length > 0, `${location}.where.field is required.`);
    issue(errors, aggregate.where?.equals !== undefined, `${location}.where.equals is required.`);
  }
}

function validateStatistics(errors, spec) {
  const statistics = spec.statistics;
  if (statistics === undefined) return;

  issue(errors, statistics && typeof statistics === "object", "statistics must be an object.");
  if (!statistics || typeof statistics !== "object") return;
  const layout = statistics.layout || "standard";
  issue(errors, STATISTICS_LAYOUTS.includes(layout), `statistics.layout must be one of: ${STATISTICS_LAYOUTS.join(", ")}.`);
  issue(errors, Array.isArray(statistics.items) && statistics.items.length >= 3 && statistics.items.length <= 5, "statistics.items must contain 3 to 5 cards.");

  (statistics.items || []).forEach((item, index) => {
    const location = `statistics.items[${index}]`;
    issue(errors, item && typeof item === "object", `${location} must be an object.`);
    if (!item || typeof item !== "object") return;
    issue(errors, typeof item.key === "string" && item.key.length > 0, `${location}.key is required.`);
    issue(errors, typeof item.label === "string" && item.label.length > 0, `${location}.label is required.`);
    issue(errors, STATISTIC_FORMATS.includes(item.format), `${location}.format must be one of: ${STATISTIC_FORMATS.join(", ")}.`);
    if (item.unit !== undefined && typeof item.unit !== "string") errors.push(`${location}.unit must be text when supplied.`);
    if (item.helpText !== undefined && typeof item.helpText !== "string") errors.push(`${location}.helpText must be text when supplied.`);

    const hasValue = typeof item.value === "number" && Number.isFinite(item.value);
    const hasAggregate = item.aggregate !== undefined;
    if (hasValue === hasAggregate) errors.push(`${location} must declare exactly one of value or aggregate.`);
    if (item.value !== undefined && !hasValue) errors.push(`${location}.value must be a finite number.`);
    if (hasAggregate) validateStatisticAggregate(errors, item.aggregate, `${location}.aggregate`);

    if (item.detailItems !== undefined) {
      issue(errors, Array.isArray(item.detailItems) && item.detailItems.length > 0, `${location}.detailItems must be a non-empty array.`);
      if ((item.detailItems || []).some((detail) => typeof detail !== "string" || !detail.length)) {
        errors.push(`${location}.detailItems must contain text.`);
      }
    }
    if (item.action !== undefined) validateAction(errors, item.action, `${location}.action`);
  });

  const hasStatisticAction = (statistics.items || []).some((item) => item?.action);
  const hasRichCardContent = (statistics.items || []).some((item) => item?.detailItems?.length || item?.action);
  if (layout === "standard" && hasRichCardContent) {
    errors.push("statistics.layout=standard cannot use detailItems or action; use rich.");
  }
  if (layout === "rich" && !hasStatisticAction) {
    errors.push("statistics.layout=rich requires an action on at least one card.");
  }
}

function validateTableSelection(errors, selection) {
  issue(errors, selection && typeof selection === "object", "table.selection must be an object.");
  if (!selection || typeof selection !== "object") return;
  issue(errors, TABLE_SELECTION_MODES.includes(selection.mode), `table.selection.mode must be one of: ${TABLE_SELECTION_MODES.join(", ")}.`);
  if (selection.itemLabel !== undefined && (typeof selection.itemLabel !== "string" || !selection.itemLabel.length)) {
    errors.push("table.selection.itemLabel must be non-empty text when supplied.");
  }
  issue(errors, Array.isArray(selection.quickActions), "table.selection.quickActions must be an array.");
  if (Array.isArray(selection.quickActions)) {
    const invalid = selection.quickActions.filter((key) => !TABLE_SELECTION_QUICK_ACTIONS.includes(key));
    if (invalid.length) errors.push(`table.selection.quickActions only supports: ${TABLE_SELECTION_QUICK_ACTIONS.join(", ")}.`);
    if (new Set(selection.quickActions).size !== selection.quickActions.length) errors.push("table.selection.quickActions must not contain duplicates.");
    const missing = TABLE_SELECTION_QUICK_ACTIONS.filter((key) => !selection.quickActions.includes(key));
    if (missing.length) errors.push(`table.selection.quickActions must include: ${missing.join(", ")}.`);
  }
}

function validateChildTableColumn(errors, column, location) {
  issue(errors, column && typeof column === "object", `${location} must be an object.`);
  if (!column || typeof column !== "object") return;
  issue(errors, typeof column.key === "string" && column.key.length > 0, `${location}.key is required.`);
  issue(errors, typeof column.label === "string" && column.label.length > 0, `${location}.label is required.`);
  if (column.format !== undefined && !LIST_COLUMN_FORMATS.includes(column.format)) {
    errors.push(`${location}.format must be one of: ${LIST_COLUMN_FORMATS.join(", ")}.`);
  }
  if (column.key === "actions" || column.format === "link") {
    errors.push(`${location} only supports display columns in the current child-table renderer.`);
  }
  if (column.fixed !== undefined) errors.push(`${location}.fixed is not supported in the current child-table renderer.`);
  if (column.align !== undefined && !["left", "center", "right"].includes(column.align)) {
    errors.push(`${location}.align must be left, center, or right.`);
  }
  if (column.ellipsis !== undefined && typeof column.ellipsis !== "boolean") {
    errors.push(`${location}.ellipsis must be a boolean.`);
  }
}

function validateTableExpandable(errors, table) {
  const expandable = table.expandable;
  issue(errors, expandable && typeof expandable === "object", "table.expandable must be an object.");
  if (!expandable || typeof expandable !== "object") return;

  issue(errors, TABLE_EXPANDABLE_MODES.includes(expandable.mode), `table.expandable.mode must be one of: ${TABLE_EXPANDABLE_MODES.join(", ")}.`);
  issue(errors, expandable.defaultExpanded === false, "table.expandable.defaultExpanded must be false.");
  issue(errors, typeof expandable.childRowsKey === "string" && expandable.childRowsKey.length > 0, "table.expandable.childRowsKey is required.");

  const childTable = expandable.childTable;
  issue(errors, childTable && typeof childTable === "object", "table.expandable.childTable must be an object.");
  if (!childTable || typeof childTable !== "object") return;
  issue(errors, typeof childTable.rowKey === "string" && childTable.rowKey.length > 0, "table.expandable.childTable.rowKey is required.");
  issue(errors, Array.isArray(childTable.columns) && childTable.columns.length > 0, "table.expandable.childTable.columns must include at least one column.");
  (childTable.columns || []).forEach((column, index) => validateChildTableColumn(errors, column, `table.expandable.childTable.columns[${index}]`));

  const childColumnKeys = (childTable.columns || []).map((column) => column?.key).filter(Boolean);
  if (new Set(childColumnKeys).size !== childColumnKeys.length) errors.push("table.expandable.childTable.columns keys must be unique.");

  ["rows", "pagination", "selection", "batchActions", "expandable", "rowActions", "primaryAction", "secondaryActions", "tools"].forEach((key) => {
    if (childTable[key] !== undefined) errors.push(`table.expandable.childTable.${key} is not supported in the current child-table renderer.`);
  });
}

function modeTabItems(form) {
  return form.modeTabs?.items || [];
}

function formGroups(form) {
  return form.groups || [];
}

function allFormFields(form) {
  return [
    ...(form.fields || []),
    ...formGroups(form).flatMap((group) => group?.fields || []),
    ...modeTabItems(form).flatMap((item) => item?.fields || [])
  ];
}

function inferredFormTemplateId(spec) {
  const form = spec.form || {};
  if (form.uploadFlow !== undefined) return "form.import-review-flow";
  if (form.steps?.length) return "form.staged-configuration";
  if (form.groups?.length) return "form.grouped-configuration";
  return "form.single-stage";
}

function isWorkflowValue(value) {
  return value === null || ["string", "number", "boolean"].includes(typeof value) || Array.isArray(value);
}

function validateListWorkflow(errors, spec) {
  const workflow = spec.workflow;
  if (workflow === undefined) return;
  issue(errors, workflow && typeof workflow === "object", "workflow must be an object.");
  if (!workflow || typeof workflow !== "object") return;

  const table = spec.table || {};
  const columns = (table.columns || []).filter((column) => column.key !== "actions");
  const columnKeys = new Set(columns.map((column) => column.key));
  const actions = [
    table.primaryAction,
    ...(table.rowActions || []),
    ...(table.rows || []).flatMap((row) => row?.actions || []),
    ...(table.columns || []).map((column) => column.action)
  ].filter(Boolean);

  const create = workflow.createDrawer;
  if (create !== undefined) {
    issue(errors, create && typeof create === "object", "workflow.createDrawer must be an object.");
    if (create && typeof create === "object") {
      issue(errors, typeof create.trigger === "string" && create.trigger.length > 0, "workflow.createDrawer.trigger is required.");
      issue(errors, typeof create.title === "string" && create.title.length > 0, "workflow.createDrawer.title is required.");
      issue(errors, table.primaryAction?.key === create.trigger, "workflow.createDrawer.trigger must match table.primaryAction.key.");
      if (create.width !== undefined && (!Number.isInteger(create.width) || create.width < 360 || create.width > 720)) errors.push("workflow.createDrawer.width must be an integer from 360 to 720.");
      const form = create.form;
      issue(errors, form && typeof form === "object", "workflow.createDrawer.form must be an object.");
      issue(errors, Array.isArray(form?.fields) && form.fields.length > 0, "workflow.createDrawer.form.fields must be a non-empty array.");
      (form?.fields || []).forEach((field, index) => validateField(errors, field, `workflow.createDrawer.form.fields[${index}]`, FORM_CONTROLS));
      const formKeys = (form?.fields || []).map((field) => field?.key).filter(Boolean);
      if (new Set(formKeys).size !== formKeys.length) errors.push("workflow.createDrawer.form.fields keys must be unique.");
      ["primaryLabel", "cancelLabel"].forEach((key) => {
        if (form?.[key] !== undefined && (typeof form[key] !== "string" || !form[key].length)) errors.push(`workflow.createDrawer.form.${key} must be non-empty text when supplied.`);
      });
      const addRow = create.addRow;
      issue(errors, addRow && typeof addRow === "object", "workflow.createDrawer.addRow must be an object.");
      if (addRow && typeof addRow === "object") {
        issue(errors, typeof addRow.keyPrefix === "string" && addRow.keyPrefix.length > 0, "workflow.createDrawer.addRow.keyPrefix is required.");
        issue(errors, addRow.fields && typeof addRow.fields === "object" && !Array.isArray(addRow.fields), "workflow.createDrawer.addRow.fields must be an object.");
        Object.entries(addRow.fields || {}).forEach(([key, mapping]) => {
          const location = `workflow.createDrawer.addRow.fields.${key}`;
          if (!columnKeys.has(key)) errors.push(`${location} must map a non-action table column.`);
          issue(errors, mapping && typeof mapping === "object", `${location} must be an object.`);
          if (!mapping || typeof mapping !== "object") return;
          if (mapping.from !== undefined && (typeof mapping.from !== "string" || !formKeys.includes(mapping.from))) errors.push(`${location}.from must reference a workflow.createDrawer.form field.`);
          if (mapping.value !== undefined && !isWorkflowValue(mapping.value)) errors.push(`${location}.value must be a scalar, null, or array when supplied.`);
          if (mapping.from === undefined && mapping.value === undefined) errors.push(`${location} requires from or value.`);
          if (mapping.from !== undefined && mapping.value !== undefined) errors.push(`${location} cannot declare both from and value.`);
        });
        columns.forEach((column) => { if (!addRow.fields?.[column.key]) errors.push(`workflow.createDrawer.addRow.fields must map table column ${column.key}.`); });
      }
    }
  }

  const detail = workflow.detailDrawer;
  if (detail !== undefined) {
    issue(errors, detail && typeof detail === "object", "workflow.detailDrawer must be an object.");
    if (detail && typeof detail === "object") {
      issue(errors, typeof detail.trigger === "string" && detail.trigger.length > 0, "workflow.detailDrawer.trigger is required.");
      issue(errors, typeof detail.title === "string" && detail.title.length > 0, "workflow.detailDrawer.title is required.");
      issue(errors, actions.some((action) => action.key === detail.trigger), "workflow.detailDrawer.trigger must match a declared table action.");
      if (detail.width !== undefined && (!Number.isInteger(detail.width) || detail.width < 360 || detail.width > 960)) errors.push("workflow.detailDrawer.width must be an integer from 360 to 960.");
      issue(errors, Array.isArray(detail.groups) && detail.groups.length > 0, "workflow.detailDrawer.groups must be a non-empty array.");
      (detail.groups || []).forEach((group, groupIndex) => {
        const location = `workflow.detailDrawer.groups[${groupIndex}]`;
        issue(errors, group && typeof group === "object", `${location} must be an object.`);
        if (!group || typeof group !== "object") return;
        issue(errors, typeof group.key === "string" && group.key.length > 0, `${location}.key is required.`);
        issue(errors, typeof group.title === "string" && group.title.length > 0, `${location}.title is required.`);
        issue(errors, Array.isArray(group.fields) && group.fields.length > 0, `${location}.fields must be a non-empty array.`);
        (group.fields || []).forEach((field, fieldIndex) => {
          const fieldLocation = `${location}.fields[${fieldIndex}]`;
          issue(errors, field && typeof field === "object", `${fieldLocation} must be an object.`);
          if (!field || typeof field !== "object") return;
          issue(errors, typeof field.key === "string" && field.key.length > 0, `${fieldLocation}.key is required.`);
          issue(errors, typeof field.label === "string" && field.label.length > 0, `${fieldLocation}.label is required.`);
          issue(errors, typeof field.sourceKey === "string" && field.sourceKey.length > 0, `${fieldLocation}.sourceKey is required.`);
          if (field.format !== undefined && !DETAIL_FIELD_FORMATS.includes(field.format)) errors.push(`${fieldLocation}.format must be one of: ${DETAIL_FIELD_FORMATS.join(", ")}.`);
          if (field.span !== undefined && !DETAIL_FIELD_SPANS.includes(field.span)) errors.push(`${fieldLocation}.span must be one of: ${DETAIL_FIELD_SPANS.join(", ")}.`);
          if (field.format === "status" && field.tone === undefined) errors.push(`${fieldLocation}.tone is required when format=status.`);
          if (field.tone !== undefined && !DETAIL_STATUS_TONES.includes(field.tone)) errors.push(`${fieldLocation}.tone must be one of: ${DETAIL_STATUS_TONES.join(", ")}.`);
        });
      });
      const groupKeys = (detail.groups || []).map((group) => group?.key).filter(Boolean);
      if (new Set(groupKeys).size !== groupKeys.length) errors.push("workflow.detailDrawer.groups keys must be unique.");
      if (detail.closeLabel !== undefined && (typeof detail.closeLabel !== "string" || !detail.closeLabel.length)) errors.push("workflow.detailDrawer.closeLabel must be non-empty text when supplied.");
    }
  }
  if (create === undefined && detail === undefined) errors.push("workflow requires createDrawer or detailDrawer.");
}

export function resolveFormTemplate(spec) {
  if (spec?.page?.family !== "form") return null;
  const id = spec.template?.id || inferredFormTemplateId(spec);
  const definition = FORM_TEMPLATE_DEFINITIONS[id];
  if (!definition) return null;
  return {
    id,
    label: definition.label,
    declared: typeof spec.template?.id === "string"
  };
}

function validateFormModeTabs(errors, form) {
  const modeTabs = form.modeTabs;
  issue(errors, modeTabs && typeof modeTabs === "object", "form.modeTabs must be an object.");
  if (!modeTabs || typeof modeTabs !== "object") return;
  issue(errors, Array.isArray(modeTabs.items) && modeTabs.items.length >= 2, "form.modeTabs.items must contain at least two modes.");
  issue(errors, typeof modeTabs.defaultKey === "string" && modeTabs.defaultKey.length > 0, "form.modeTabs.defaultKey is required.");

  const baseKeys = new Set((form.fields || []).map((field) => field?.key).filter(Boolean));
  const modeKeys = [];
  (modeTabs.items || []).forEach((item, index) => {
    const location = `form.modeTabs.items[${index}]`;
    issue(errors, item && typeof item === "object", `${location} must be an object.`);
    if (!item || typeof item !== "object") return;
    issue(errors, typeof item.key === "string" && item.key.length > 0, `${location}.key is required.`);
    issue(errors, typeof item.label === "string" && item.label.length > 0, `${location}.label is required.`);
    issue(errors, Array.isArray(item.fields) && item.fields.length > 0, `${location}.fields must include at least one field.`);
    (item.fields || []).forEach((field, fieldIndex) => validateField(errors, field, `${location}.fields[${fieldIndex}]`, FORM_CONTROLS));
    if (item.disabledUntil !== undefined) {
      issue(errors, Array.isArray(item.disabledUntil), `${location}.disabledUntil must be an array.`);
      const availableKeys = new Set([...baseKeys, ...(item.fields || []).map((field) => field?.key).filter(Boolean)]);
      (item.disabledUntil || []).forEach((key) => {
        if (typeof key !== "string" || !availableKeys.has(key)) errors.push(`${location}.disabledUntil can only reference common or current-mode fields.`);
      });
    }
    if (item.key) modeKeys.push(item.key);
  });

  if (new Set(modeKeys).size !== modeKeys.length) errors.push("form.modeTabs.items keys must be unique.");
  if (modeTabs.defaultKey && !modeKeys.includes(modeTabs.defaultKey)) errors.push("form.modeTabs.defaultKey must match a mode item.");
}

function validateFormGroups(errors, form) {
  const groups = form.groups;
  if (groups === undefined) return;

  issue(errors, Array.isArray(groups) && groups.length >= 2, "form.groups must contain at least two information groups.");
  if (!Array.isArray(groups)) return;

  issue(errors, form.fieldLayout === "multi-column", "form.groups requires form.fieldLayout=multi-column.");
  issue(errors, FORM_GRID_COLUMNS.includes(form.columns), `form.groups requires form.columns to be one of: ${FORM_GRID_COLUMNS.join(", ")}.`);

  const groupKeys = [];
  groups.forEach((group, index) => {
    const location = `form.groups[${index}]`;
    issue(errors, group && typeof group === "object", `${location} must be an object.`);
    if (!group || typeof group !== "object") return;
    issue(errors, typeof group.key === "string" && group.key.length > 0, `${location}.key is required.`);
    issue(errors, typeof group.title === "string" && group.title.length > 0, `${location}.title is required.`);
    if (group.description !== undefined && (typeof group.description !== "string" || !group.description.length)) {
      errors.push(`${location}.description must be non-empty text when supplied.`);
    }
    issue(errors, Array.isArray(group.fields) && group.fields.length > 0, `${location}.fields must include at least one field.`);
    (group.fields || []).forEach((field, fieldIndex) => {
      const fieldLocation = `${location}.fields[${fieldIndex}]`;
      validateField(errors, field, fieldLocation, FORM_CONTROLS);
      if (field?.span !== undefined && (!Number.isInteger(field.span) || field.span < 1 || !FORM_GRID_COLUMNS.includes(form.columns) || field.span > form.columns)) {
        errors.push(`${fieldLocation}.span must be an integer between 1 and form.columns.`);
      }
    });
    if (group.key) groupKeys.push(group.key);
  });

  if (new Set(groupKeys).size !== groupKeys.length) errors.push("form.groups keys must be unique.");
}

function validateReviewColumn(errors, column, location) {
  issue(errors, column && typeof column === "object", `${location} must be an object.`);
  if (!column || typeof column !== "object") return;
  issue(errors, typeof column.key === "string" && column.key.length > 0, `${location}.key is required.`);
  issue(errors, typeof column.label === "string" && column.label.length > 0, `${location}.label is required.`);
  if (column.format !== undefined && !FORM_REVIEW_COLUMN_FORMATS.includes(column.format)) {
    errors.push(`${location}.format must be one of: ${FORM_REVIEW_COLUMN_FORMATS.join(", ")}.`);
  }
  if (column.align !== undefined && !["left", "center", "right"].includes(column.align)) {
    errors.push(`${location}.align must be left, center, or right.`);
  }
  if (column.ellipsis !== undefined && typeof column.ellipsis !== "boolean") {
    errors.push(`${location}.ellipsis must be a boolean.`);
  }
}

function validateUploadFlow(errors, form) {
  const uploadFlow = form.uploadFlow;
  issue(errors, uploadFlow && typeof uploadFlow === "object", "form.uploadFlow must be an object.");
  if (!uploadFlow || typeof uploadFlow !== "object") return;

  issue(errors, Array.isArray(form.steps) && form.steps.length >= 3, "form.uploadFlow requires at least three form.steps.");
  if (!allFormFields(form).some((field) => field?.control === "upload")) {
    errors.push("form.uploadFlow requires an upload field.");
  }

  const review = uploadFlow.review;
  issue(errors, review && typeof review === "object", "form.uploadFlow.review must be an object.");
  if (review && typeof review === "object") {
    issue(errors, typeof review.validationMessage === "string" && review.validationMessage.length > 0, "form.uploadFlow.review.validationMessage is required.");
    issue(errors, typeof review.rowKey === "string" && review.rowKey.length > 0, "form.uploadFlow.review.rowKey is required.");
    issue(errors, Array.isArray(review.columns) && review.columns.length > 0, "form.uploadFlow.review.columns must include at least one column.");
    issue(errors, Array.isArray(review.rows) && review.rows.length > 0, "form.uploadFlow.review.rows must include at least one row.");
    (review.columns || []).forEach((column, index) => validateReviewColumn(errors, column, `form.uploadFlow.review.columns[${index}]`));
    const columnKeys = (review.columns || []).map((column) => column?.key).filter(Boolean);
    if (new Set(columnKeys).size !== columnKeys.length) errors.push("form.uploadFlow.review.columns keys must be unique.");
    (review.rows || []).forEach((row, index) => {
      issue(errors, row && typeof row === "object", `form.uploadFlow.review.rows[${index}] must be an object.`);
      if (row && typeof row === "object") {
        issue(errors, row[review.rowKey] !== undefined && row[review.rowKey] !== null && row[review.rowKey] !== "", `form.uploadFlow.review.rows[${index}] must declare ${review.rowKey}.`);
      }
    });
    const rowKeys = (review.rows || []).map((row) => row?.[review.rowKey]).filter((key) => key !== undefined && key !== null && key !== "");
    if (new Set(rowKeys).size !== rowKeys.length) errors.push("form.uploadFlow.review rowKey values must be unique.");
    issue(errors, Array.isArray(review.summary?.items) && review.summary.items.length > 0, "form.uploadFlow.review.summary.items must be a non-empty array.");
    (review.summary?.items || []).forEach((item, index) => {
      issue(errors, item && typeof item === "object", `form.uploadFlow.review.summary.items[${index}] must be an object.`);
      issue(errors, typeof item?.label === "string" && item.label.length > 0, `form.uploadFlow.review.summary.items[${index}].label is required.`);
      issue(errors, typeof item?.value === "string" || typeof item?.value === "number", `form.uploadFlow.review.summary.items[${index}].value is required.`);
    });
  }

  const result = uploadFlow.result;
  issue(errors, result && typeof result === "object", "form.uploadFlow.result must be an object.");
  if (result && typeof result === "object") {
    issue(errors, typeof result.title === "string" && result.title.length > 0, "form.uploadFlow.result.title is required.");
    if (result.subtitle !== undefined && (typeof result.subtitle !== "string" || !result.subtitle.length)) {
      errors.push("form.uploadFlow.result.subtitle must be non-empty text when supplied.");
    }
    issue(errors, Array.isArray(result.summaryItems) && result.summaryItems.length > 0, "form.uploadFlow.result.summaryItems must be a non-empty array.");
    (result.summaryItems || []).forEach((item, index) => {
      issue(errors, item && typeof item === "object", `form.uploadFlow.result.summaryItems[${index}] must be an object.`);
      issue(errors, typeof item?.label === "string" && item.label.length > 0, `form.uploadFlow.result.summaryItems[${index}].label is required.`);
      issue(errors, typeof item?.value === "string" || typeof item?.value === "number", `form.uploadFlow.result.summaryItems[${index}].value is required.`);
    });
    issue(errors, result.actions && typeof result.actions === "object", "form.uploadFlow.result.actions must be an object.");
    if (result.actions && typeof result.actions === "object") {
      validateAction(errors, result.actions.primary, "form.uploadFlow.result.actions.primary");
      validateAction(errors, result.actions.secondary, "form.uploadFlow.result.actions.secondary");
    }
  }
}

function validateFormSubmitResult(errors, result) {
  issue(errors, result && typeof result === "object", "form.submit.result must be an object.");
  if (!result || typeof result !== "object") return;
  issue(errors, RESULT_STATUSES.includes(result.status), `form.submit.result.status must be one of: ${RESULT_STATUSES.join(", ")}.`);
  issue(errors, typeof result.title === "string" && result.title.length > 0, "form.submit.result.title is required.");
  issue(errors, typeof result.description === "string" && result.description.length > 0, "form.submit.result.description is required.");
}

function validateForm(errors, spec) {
  const form = spec.form;
  const capabilities = spec.content?.capabilities || [];
  issue(errors, form && typeof form === "object", "form pages require a form declaration.");
  if (!form || typeof form !== "object") return;

  if (form.fields !== undefined) issue(errors, Array.isArray(form.fields), "form.fields must be an array when supplied.");
  (form.fields || []).forEach((field, index) => validateField(errors, field, `form.fields[${index}]`, FORM_CONTROLS));
  if (form.modeTabs !== undefined) validateFormModeTabs(errors, form);
  validateFormGroups(errors, form);

  const fields = allFormFields(form);
  issue(errors, fields.length > 0, "form pages must declare at least one field in form.fields, form.groups, or form.modeTabs.");
  const fieldKeys = fields.map((field) => field?.key).filter(Boolean);
  if (new Set(fieldKeys).size !== fieldKeys.length) errors.push("form field keys must be unique across common and mode-specific fields.");

  issue(errors, FORM_FIELD_LAYOUTS.includes(form.fieldLayout), `form.fieldLayout must be one of: ${FORM_FIELD_LAYOUTS.join(", ")}.`);
  const groupsUsed = formGroups(form).length > 0;
  if (form.fieldLayout === "multi-column" && !groupsUsed) errors.push("form.fieldLayout=multi-column requires form.groups.");
  if (form.fieldLayout === "single-column" && form.columns !== undefined) errors.push("form.columns is only supported with form.fieldLayout=multi-column.");
  if (!groupsUsed && form.columns !== undefined) errors.push("form.columns requires form.groups.");
  if (groupsUsed && form.modeTabs !== undefined) errors.push("form.groups cannot be combined with form.modeTabs in the current renderer.");

  issue(errors, form.actions?.primaryLabel || form.submit?.label || form.submit?.successTarget, "form pages require a primary action or submit target.");
  if (form.actions?.secondaryActions !== undefined) {
    issue(errors, Array.isArray(form.actions.secondaryActions), "form.actions.secondaryActions must be an array.");
    (form.actions.secondaryActions || []).forEach((action, index) => validateAction(errors, action, `form.actions.secondaryActions[${index}]`));
  }
  if (form.submit?.disabledUntil) {
    issue(errors, Array.isArray(form.submit.disabledUntil), "form.submit.disabledUntil must be an array.");
    (form.submit.disabledUntil || []).forEach((key) => {
      if (typeof key !== "string" || !fieldKeys.includes(key)) errors.push("form.submit.disabledUntil can only reference declared form fields.");
    });
  }
  if (form.steps !== undefined) {
    issue(errors, Array.isArray(form.steps) && form.steps.length >= 2, "form.steps must contain at least two steps when supplied.");
    const stepKeys = [];
    (form.steps || []).forEach((step, index) => {
      const location = `form.steps[${index}]`;
      issue(errors, step && typeof step === "object", `${location} must be an object.`);
      if (!step || typeof step !== "object") return;
      issue(errors, typeof step.key === "string" && step.key.length > 0, `${location}.key is required.`);
      issue(errors, typeof step.title === "string" && step.title.length > 0, `${location}.title is required.`);
      issue(errors, FORM_STEP_STATUSES.includes(step.status), `${location}.status must be one of: ${FORM_STEP_STATUSES.join(", ")}.`);
      if (step.fieldKeys !== undefined && !Array.isArray(step.fieldKeys)) {
        errors.push(`${location}.fieldKeys must be an array when supplied.`);
      }
      if (step.description !== undefined && (typeof step.description !== "string" || !step.description.length)) {
        errors.push(`${location}.description must be non-empty text when supplied.`);
      }
      if (step.key) stepKeys.push(step.key);
    });
    if (new Set(stepKeys).size !== stepKeys.length) errors.push("form.steps keys must be unique.");
    if ((form.steps || []).filter((step) => step?.status === "process").length !== 1) {
      errors.push("form.steps must contain exactly one process step in its entry state.");
    }
  }
  if (spec.template?.id === "form.staged-configuration") {
    const steps = form.steps || [];
    const confirmation = form.confirmation;
    issue(errors, confirmation && typeof confirmation === "object", "template.id=form.staged-configuration requires form.confirmation.");
    if (confirmation && typeof confirmation === "object") {
      issue(errors, typeof confirmation.step === "string" && confirmation.step.length > 0, "form.confirmation.step is required.");
      issue(errors, typeof confirmation.title === "string" && confirmation.title.length > 0, "form.confirmation.title is required.");
      issue(errors, Array.isArray(confirmation.fields) && confirmation.fields.length > 0, "form.confirmation.fields must be a non-empty array.");
      (confirmation.fields || []).forEach((key, index) => {
        if (typeof key !== "string" || !fieldKeys.includes(key)) {
          errors.push(`form.confirmation.fields[${index}] must reference a declared form field.`);
        }
      });
      if (!steps.some((step) => step?.key === confirmation.step)) {
        errors.push("form.confirmation.step must match a declared form step.");
      }
    }

    const editableStepKeys = [];
    steps.forEach((step, index) => {
      if (step?.key === confirmation?.step) {
        if (step.fieldKeys !== undefined) {
          errors.push(`form.steps[${index}].fieldKeys is not allowed for the confirmation step; use form.confirmation.fields.`);
        }
        return;
      }
      const location = `form.steps[${index}].fieldKeys`;
      issue(errors, Array.isArray(step?.fieldKeys) && step.fieldKeys.length > 0, `${location} must be a non-empty array for an editable stage.`);
      (step?.fieldKeys || []).forEach((key, fieldIndex) => {
        if (typeof key !== "string" || !fieldKeys.includes(key)) {
          errors.push(`${location}[${fieldIndex}] must reference a declared form field.`);
        } else {
          editableStepKeys.push(key);
        }
      });
    });
    if (new Set(editableStepKeys).size !== editableStepKeys.length) {
      errors.push("form.steps fieldKeys must not assign one field to multiple editable stages.");
    }
    const unassignedFields = fieldKeys.filter((key) => !editableStepKeys.includes(key));
    if (unassignedFields.length) {
      errors.push(`template.id=form.staged-configuration must assign every form field to one editable step: ${unassignedFields.join(", ")}.`);
    }
    if (form.stepValidation !== undefined) {
      errors.push("form.stepValidation is not supported; use form.steps[].fieldKeys to declare the fields in each stage.");
    }
    if (form.actions?.primaryLabel === "下一步") {
      errors.push("template.id=form.staged-configuration requires form.actions.primaryLabel to name the final confirmation action, not 下一步.");
    }
    if (form.submit?.result === undefined) {
      errors.push("template.id=form.staged-configuration requires form.submit.result so successful completion transitions to a result page.");
    }
  } else if (form.confirmation !== undefined) {
    errors.push("form.confirmation is supported only by template.id=form.staged-configuration.");
  }
  if (form.interactions) {
    issue(errors, Array.isArray(form.interactions), "form.interactions must be an array.");
    (form.interactions || []).forEach((interaction, index) => {
      issue(errors, typeof interaction.on === "string", `form.interactions[${index}].on is required.`);
      if (typeof interaction.on === "string" && !fieldKeys.includes(interaction.on)) {
        errors.push(`form.interactions[${index}].on must reference a declared form field.`);
      }
      issue(errors, interaction.effect === "clear-editable-fields", `form.interactions[${index}].effect is not supported.`);
    });
  }
  if (form.submit?.failureSimulation !== undefined) {
    const simulation = form.submit.failureSimulation;
    issue(errors, simulation && typeof simulation === "object", "form.submit.failureSimulation must be an object.");
    if (simulation && typeof simulation === "object") {
      issue(errors, typeof simulation.field === "string" && fieldKeys.includes(simulation.field), "form.submit.failureSimulation.field must reference a declared form field.");
      issue(errors, typeof simulation.endsWith === "string" && simulation.endsWith.length > 0, "form.submit.failureSimulation.endsWith is required.");
    }
  }
  if (form.submit?.preserveOnError !== undefined && typeof form.submit.preserveOnError !== "boolean") {
    errors.push("form.submit.preserveOnError must be a boolean when supplied.");
  }
  if (form.submit?.result !== undefined) validateFormSubmitResult(errors, form.submit.result);
  if (form.actions?.placement && !FORM_ACTION_PLACEMENTS.includes(form.actions.placement)) {
    errors.push(`form.actions.placement must be one of: ${FORM_ACTION_PLACEMENTS.join(", ")}.`);
  }
  if (form.uploadFlow !== undefined) validateUploadFlow(errors, form);

  const stepsUsed = Boolean(form.steps?.length);
  const modeTabsUsed = form.modeTabs !== undefined;
  const uploadUsed = fields.some((field) => field?.control === "upload");
  const stickyActionsUsed = form.actions?.placement === "sticky-end";
  const reviewTableUsed = Boolean(form.uploadFlow?.review);
  const uploadFlowUsed = form.uploadFlow !== undefined;
  const submitResultUsed = form.submit?.result !== undefined;

  usesCapability(errors, capabilities, stepsUsed, "form.steps");
  usesCapability(errors, capabilities, groupsUsed, "form.groups");
  usesCapability(errors, capabilities, modeTabsUsed, "form.modeTabs");
  usesCapability(errors, capabilities, uploadUsed, "form.upload");
  usesCapability(errors, capabilities, stickyActionsUsed, "form.stickyActions");
  usesCapability(errors, capabilities, reviewTableUsed, "form.reviewTable");
  usesCapability(errors, capabilities, uploadFlowUsed, "form.uploadFlow");
  if (submitResultUsed && spec.template?.id !== "form.staged-configuration") {
    errors.push("form.submit.result is currently supported only by template.id=form.staged-configuration.");
  }

  if (groupsUsed) {
    if (capabilities.includes("form.sideIllustration")) errors.push("form.groups cannot be combined with form.sideIllustration.");
    if (!stickyActionsUsed) errors.push("form.groups requires form.actions.placement=sticky-end.");
  }
  if (uploadFlowUsed) {
    ["form.steps", "form.upload", "form.reviewTable", "form.stickyActions"].forEach((capability) => {
      if (!capabilities.includes(capability)) errors.push(`form.uploadFlow requires ${capability}.`);
    });
    if (!stickyActionsUsed) errors.push("form.uploadFlow requires form.actions.placement=sticky-end.");
  }
}

function validateFormTemplate(errors, spec, options) {
  const template = spec.template;
  if (template === undefined) {
    if (options.requireExplicitFormTemplate) {
      errors.push("form pages written through the current workflow require template.id.");
    }
    return;
  }

  issue(errors, template && typeof template === "object" && !Array.isArray(template), "template must be an object.");
  if (!template || typeof template !== "object" || Array.isArray(template)) return;
  issue(errors, typeof template.id === "string" && FORM_TEMPLATE_IDS.includes(template.id), `template.id must be one of: ${FORM_TEMPLATE_IDS.join(", ")}.`);
  if (!FORM_TEMPLATE_IDS.includes(template.id)) return;

  const form = spec.form || {};
  const capabilities = spec.content?.capabilities || [];
  const has = (capability) => capabilities.includes(capability);
  const editableFieldCount = allFormFields(form).filter((field) => field?.control !== "static").length;

  if (template.id === "form.single-stage") {
    if (!has("form.simple")) errors.push("template.id=form.single-stage requires form.simple.");
    if (form.fieldLayout !== "single-column") errors.push("template.id=form.single-stage requires form.fieldLayout=single-column.");
    if (editableFieldCount > 7) errors.push("template.id=form.single-stage supports at most 7 editable fields; choose a grouped or staged template.");
    ["form.steps", "form.groups", "form.stickyActions", "form.modeTabs", "form.reviewTable", "form.uploadFlow"].forEach((capability) => {
      if (has(capability)) errors.push(`template.id=form.single-stage cannot use ${capability}.`);
    });
  }

  if (template.id === "form.grouped-configuration") {
    ["form.groups", "form.stickyActions"].forEach((capability) => {
      if (!has(capability)) errors.push(`template.id=form.grouped-configuration requires ${capability}.`);
    });
    ["form.steps", "form.sideIllustration", "form.reviewTable", "form.uploadFlow"].forEach((capability) => {
      if (has(capability)) errors.push(`template.id=form.grouped-configuration cannot use ${capability}; choose a staged or import-review template.`);
    });
  }

  if (template.id === "form.staged-configuration") {
    if (!has("form.steps")) errors.push("template.id=form.staged-configuration requires form.steps.");
    ["form.reviewTable", "form.uploadFlow"].forEach((capability) => {
      if (has(capability)) errors.push(`template.id=form.staged-configuration cannot use ${capability}; choose form.import-review-flow.`);
    });
  }

  if (template.id === "form.import-review-flow") {
    ["form.steps", "form.upload", "form.reviewTable", "form.uploadFlow", "form.stickyActions"].forEach((capability) => {
      if (!has(capability)) errors.push(`template.id=form.import-review-flow requires ${capability}.`);
    });
  }
}

function isDisplayValue(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function validateDetailField(errors, field, location) {
  issue(errors, field && typeof field === "object", `${location} must be an object.`);
  if (!field || typeof field !== "object") return;
  issue(errors, typeof field.key === "string" && field.key.length > 0, `${location}.key is required.`);
  issue(errors, typeof field.label === "string" && field.label.length > 0, `${location}.label is required.`);
  issue(errors, isDisplayValue(field.value), `${location}.value must be text, number, or boolean.`);
  if (field.format !== undefined && !DETAIL_FIELD_FORMATS.includes(field.format)) {
    errors.push(`${location}.format must be one of: ${DETAIL_FIELD_FORMATS.join(", ")}.`);
  }
  if (field.span !== undefined && !DETAIL_FIELD_SPANS.includes(field.span)) {
    errors.push(`${location}.span must be one of: ${DETAIL_FIELD_SPANS.join(", ")}.`);
  }
  if (field.tone !== undefined && !DETAIL_STATUS_TONES.includes(field.tone)) {
    errors.push(`${location}.tone must be one of: ${DETAIL_STATUS_TONES.join(", ")}.`);
  }
  if (field.format === "status" && field.tone === undefined) {
    errors.push(`${location}.tone is required when format=status.`);
  }
}

function validateDetailTable(errors, table, location) {
  issue(errors, table && typeof table === "object", `${location} must be an object.`);
  if (!table || typeof table !== "object") return;
  issue(errors, typeof table.rowKey === "string" && table.rowKey.length > 0, `${location}.rowKey is required.`);
  issue(errors, Array.isArray(table.columns) && table.columns.length > 0, `${location}.columns must include at least one column.`);
  issue(errors, Array.isArray(table.rows), `${location}.rows must be an array.`);
  (table.columns || []).forEach((column, index) => {
    const columnLocation = `${location}.columns[${index}]`;
    issue(errors, column && typeof column === "object", `${columnLocation} must be an object.`);
    if (!column || typeof column !== "object") return;
    issue(errors, typeof column.key === "string" && column.key.length > 0, `${columnLocation}.key is required.`);
    issue(errors, typeof column.label === "string" && column.label.length > 0, `${columnLocation}.label is required.`);
    if (column.format !== undefined && !DETAIL_TABLE_COLUMN_FORMATS.includes(column.format)) {
      errors.push(`${columnLocation}.format must be one of: ${DETAIL_TABLE_COLUMN_FORMATS.join(", ")}.`);
    }
    if (column.align !== undefined && !["left", "center", "right"].includes(column.align)) {
      errors.push(`${columnLocation}.align must be left, center, or right.`);
    }
    if (column.ellipsis !== undefined && typeof column.ellipsis !== "boolean") {
      errors.push(`${columnLocation}.ellipsis must be a boolean.`);
    }
    if (column.format === "status" && column.statusMap === undefined) {
      errors.push(`${columnLocation}.statusMap is required when format=status.`);
    }
  });
  const columnKeys = (table.columns || []).map((column) => column?.key).filter(Boolean);
  if (new Set(columnKeys).size !== columnKeys.length) errors.push(`${location}.columns keys must be unique.`);

  (table.rows || []).forEach((row, index) => {
    issue(errors, row && typeof row === "object", `${location}.rows[${index}] must be an object.`);
    if (row && typeof row === "object") {
      issue(errors, row[table.rowKey] !== undefined && row[table.rowKey] !== null && row[table.rowKey] !== "", `${location}.rows[${index}] must declare ${table.rowKey}.`);
    }
  });
  const rowKeys = (table.rows || []).map((row) => row?.[table.rowKey]).filter((key) => key !== undefined && key !== null && key !== "");
  if (new Set(rowKeys).size !== rowKeys.length) errors.push(`${location}.rowKey values must be unique.`);
}

function validateDetailActions(errors, actions, location) {
  if (actions === undefined) return false;
  issue(errors, actions && typeof actions === "object", `${location} must be an object.`);
  if (!actions || typeof actions !== "object") return false;
  if (actions.primary !== undefined) validateAction(errors, actions.primary, `${location}.primary`);
  if (actions.secondary !== undefined) {
    issue(errors, Array.isArray(actions.secondary), `${location}.secondary must be an array.`);
    (actions.secondary || []).forEach((action, index) => validateAction(errors, action, `${location}.secondary[${index}]`));
  }
  if (!actions.primary && !(actions.secondary || []).length) errors.push(`${location} must contain primary or secondary actions.`);
  return Boolean(actions.primary || actions.secondary?.length);
}

function validateDetail(errors, spec) {
  const detail = spec.detail;
  const capabilities = spec.content?.capabilities || [];
  const presentation = spec.page?.presentation;
  issue(errors, detail && typeof detail === "object", "detail pages require a detail declaration.");
  if (!detail || typeof detail !== "object") return;
  issue(errors, DETAIL_PRESENTATIONS.includes(presentation), `detail page.presentation must be one of: ${DETAIL_PRESENTATIONS.join(", ")}.`);
  issue(errors, typeof detail.title === "string" && detail.title.length > 0, "detail.title is required.");
  issue(errors, Array.isArray(detail.groups) && detail.groups.length > 0, "detail.groups must include at least one information group.");

  const groupKeys = [];
  let embeddedTableUsed = false;
  (detail.groups || []).forEach((group, index) => {
    const location = `detail.groups[${index}]`;
    issue(errors, group && typeof group === "object", `${location} must be an object.`);
    if (!group || typeof group !== "object") return;
    issue(errors, typeof group.key === "string" && group.key.length > 0, `${location}.key is required.`);
    issue(errors, typeof group.title === "string" && group.title.length > 0, `${location}.title is required.`);
    if (group.description !== undefined && (typeof group.description !== "string" || !group.description.length)) {
      errors.push(`${location}.description must be non-empty text when supplied.`);
    }
    if (group.fields !== undefined) {
      issue(errors, Array.isArray(group.fields), `${location}.fields must be an array when supplied.`);
      (group.fields || []).forEach((field, fieldIndex) => validateDetailField(errors, field, `${location}.fields[${fieldIndex}]`));
    }
    if (group.table !== undefined) {
      embeddedTableUsed = true;
      validateDetailTable(errors, group.table, `${location}.table`);
    }
    if (!(group.fields || []).length && group.table === undefined) {
      errors.push(`${location} must include fields or one embedded table.`);
    }
    if (group.key) groupKeys.push(group.key);
  });
  if (new Set(groupKeys).size !== groupKeys.length) errors.push("detail.groups keys must be unique.");

  const metrics = detail.metrics;
  if (metrics !== undefined) {
    issue(errors, Array.isArray(metrics) && metrics.length >= 1 && metrics.length <= 4, "detail.metrics must contain 1 to 4 items.");
    (metrics || []).forEach((item, index) => {
      const location = `detail.metrics[${index}]`;
      issue(errors, item && typeof item === "object", `${location} must be an object.`);
      issue(errors, typeof item?.key === "string" && item.key.length > 0, `${location}.key is required.`);
      issue(errors, typeof item?.label === "string" && item.label.length > 0, `${location}.label is required.`);
      issue(errors, isDisplayValue(item?.value), `${location}.value must be text, number, or boolean.`);
      if (item?.description !== undefined && (typeof item.description !== "string" || !item.description.length)) {
        errors.push(`${location}.description must be non-empty text when supplied.`);
      }
    });
  }

  const actionsUsed = validateDetailActions(errors, detail.actions, "detail.actions");
  const groupsUsed = Boolean(detail.groups?.length);
  const anchorsUsed = capabilities.includes("detail.anchors");
  const tabsUsed = capabilities.includes("detail.sectionTabs");
  const metricsUsed = Boolean(metrics?.length);

  usesCapability(errors, capabilities, groupsUsed, "detail.groups");
  usesCapability(errors, capabilities, embeddedTableUsed, "detail.embeddedTable");
  usesCapability(errors, capabilities, metricsUsed, "detail.metrics");
  usesCapability(errors, capabilities, actionsUsed, "detail.actions");

  if (presentation === "modal" && !capabilities.includes("detail.quickView")) {
    errors.push("detail modal presentation requires detail.quickView.");
  }
  if (capabilities.includes("detail.quickView") && !["modal", "drawer"].includes(presentation)) {
    errors.push("detail.quickView only supports modal or drawer presentation.");
  }
  if (presentation === "modal" && (detail.groups || []).some((group) => group?.table !== undefined)) {
    errors.push("detail modal presentation cannot contain an embedded table; use drawer or page.");
  }
  if (presentation === "modal" && (detail.groups || []).length !== 1) {
    errors.push("detail modal presentation requires exactly one quick-view information group.");
  }
  if (presentation === "modal" && (detail.groups || []).some((group) => group?.description !== undefined)) {
    errors.push("detail modal presentation cannot use group descriptions; keep the quick view flat.");
  }
  if (anchorsUsed && tabsUsed) errors.push("detail.anchors and detail.sectionTabs cannot be combined.");
  if ((anchorsUsed || tabsUsed) && presentation !== "page") {
    errors.push("detail.anchors and detail.sectionTabs require page presentation.");
  }
  if ((anchorsUsed || tabsUsed) && (detail.groups || []).length < 2) {
    errors.push("detail.anchors and detail.sectionTabs require at least two information groups.");
  }
  if (metricsUsed && presentation !== "page") errors.push("detail.metrics requires page presentation.");
}

function validateResultActions(errors, actions, location = "result.actions", { allowLabelOnly = false } = {}) {
  issue(errors, actions && typeof actions === "object", `${location} must be an object.`);
  if (!actions || typeof actions !== "object") return;
  const validateResultAction = (action, actionLocation) => {
    if (!allowLabelOnly) {
      validateAction(errors, action, actionLocation);
      return;
    }
    if (typeof action === "string") {
      issue(errors, action.length > 0, `${actionLocation} must be non-empty text.`);
      return;
    }
    issue(errors, action && typeof action === "object", `${actionLocation} must be non-empty text or an object.`);
    if (action && typeof action === "object") {
      issue(errors, typeof action.label === "string" && action.label.length > 0, `${actionLocation}.label is required.`);
      if (action.key !== undefined && (typeof action.key !== "string" || !action.key.length)) {
        errors.push(`${actionLocation}.key must be non-empty text when supplied.`);
      }
    }
  };
  if (actions.primary !== undefined) validateResultAction(actions.primary, `${location}.primary`);
  if (actions.secondary !== undefined) {
    issue(errors, Array.isArray(actions.secondary), `${location}.secondary must be an array.`);
    (actions.secondary || []).forEach((action, index) => validateResultAction(action, `${location}.secondary[${index}]`));
  }
  if (!actions.primary && !(actions.secondary || []).length) errors.push(`${location} must contain at least one follow-up action.`);
}

function validateResult(errors, spec) {
  const result = spec.result;
  const capabilities = spec.content?.capabilities || [];
  const presentation = spec.page?.presentation;
  issue(errors, result && typeof result === "object", "result pages require a result declaration.");
  if (!result || typeof result !== "object") return;
  issue(errors, RESULT_PRESENTATIONS.includes(presentation), `result page.presentation must be one of: ${RESULT_PRESENTATIONS.join(", ")}.`);
  issue(errors, RESULT_STATUSES.includes(result.status), `result.status must be one of: ${RESULT_STATUSES.join(", ")}.`);
  issue(errors, typeof result.title === "string" && result.title.length > 0, "result.title is required.");
  issue(errors, typeof result.description === "string" && result.description.length > 0, "result.description is required.");
  issue(errors, typeof result.source === "string" && result.source.length > 0, "result.source is required.");
  validateResultActions(errors, result.actions);

  if (result.summary !== undefined) {
    issue(errors, result.summary && typeof result.summary === "object", "result.summary must be an object.");
    issue(errors, Array.isArray(result.summary?.items) && result.summary.items.length >= 2 && result.summary.items.length <= 6, "result.summary.items must contain 2 to 6 items.");
    (result.summary?.items || []).forEach((item, index) => {
      const location = `result.summary.items[${index}]`;
      issue(errors, item && typeof item === "object", `${location} must be an object.`);
      issue(errors, typeof item?.key === "string" && item.key.length > 0, `${location}.key is required.`);
      issue(errors, typeof item?.label === "string" && item.label.length > 0, `${location}.label is required.`);
      issue(errors, isDisplayValue(item?.value), `${location}.value must be text, number, or boolean.`);
    });
  }

  if (result.feedback !== undefined) {
    issue(errors, result.feedback && typeof result.feedback === "object", "result.feedback must be an object.");
    issue(errors, typeof result.feedback?.prompt === "string" && result.feedback.prompt.length > 0, "result.feedback.prompt is required.");
    issue(errors, Array.isArray(result.feedback?.options) && result.feedback.options.length >= 3 && result.feedback.options.length <= 5, "result.feedback.options must contain 3 to 5 items.");
    const feedbackKeys = [];
    (result.feedback?.options || []).forEach((option, index) => {
      const location = `result.feedback.options[${index}]`;
      issue(errors, option && typeof option === "object", `${location} must be an object.`);
      issue(errors, typeof option?.key === "string" && option.key.length > 0, `${location}.key is required.`);
      issue(errors, typeof option?.label === "string" && option.label.length > 0, `${location}.label is required.`);
      if (option?.key) feedbackKeys.push(option.key);
    });
    if (new Set(feedbackKeys).size !== feedbackKeys.length) errors.push("result.feedback.options keys must be unique.");
  }

  const summaryUsed = result.summary !== undefined;
  const feedbackUsed = result.feedback !== undefined;
  if (!capabilities.includes("result.basic")) errors.push("result pages require result.basic.");
  usesCapability(errors, capabilities, summaryUsed, "result.summary");
  usesCapability(errors, capabilities, feedbackUsed, "result.feedback");
  if (feedbackUsed && result.status !== "success") errors.push("result.feedback is only supported for success results.");
  if (result.status === "error" && !result.actions?.primary && !(result.actions?.secondary || []).length) {
    errors.push("error results require a recovery action.");
  }
}

function validateList(errors, spec) {
  const query = spec.query;
  const table = spec.table;
  issue(errors, query && typeof query === "object", "list pages require a query declaration.");
  issue(errors, table && typeof table === "object", "list pages require a table declaration.");
  if (query?.fields) {
    query.fields.forEach((field, index) => {
      validateField(errors, field, `query.fields[${index}]`, LIST_QUERY_CONTROLS);
      if (field.span !== undefined && (!Number.isInteger(field.span) || field.span < 1 || field.span > 3)) {
        errors.push(`query.fields[${index}].span must be an integer between 1 and 3.`);
      }
      if (field.advanced !== undefined && typeof field.advanced !== "boolean") {
        errors.push(`query.fields[${index}].advanced must be a boolean.`);
      }
    });
  }
  if (query?.collapsible !== undefined && ![true, false, "auto"].includes(query.collapsible)) {
    errors.push("query.collapsible must be true, false, or auto.");
  }
  if (query?.collapseThreshold !== undefined && (!Number.isInteger(query.collapseThreshold) || query.collapseThreshold < 1)) {
    errors.push("query.collapseThreshold must be a positive integer.");
  }
  if (query?.quickRanges !== undefined) {
    if (!Array.isArray(query.quickRanges) || query.quickRanges.some((key) => !QUICK_RANGE_KEYS.includes(key))) {
      errors.push(`query.quickRanges only supports: ${QUICK_RANGE_KEYS.join(", ")}.`);
    }
    if ((query.fields || []).filter((field) => field.control === "date-range").length !== 1) {
      errors.push("query.quickRanges requires exactly one date-range field.");
    }
  }
  if (query?.defaultQuickRange !== undefined && !QUICK_RANGE_KEYS.includes(query.defaultQuickRange)) {
    errors.push(`query.defaultQuickRange only supports: ${QUICK_RANGE_KEYS.join(", ")}.`);
  }
  if (table) {
    issue(errors, typeof table.rowKey === "string" && table.rowKey.length > 0, "table.rowKey is required.");
    issue(errors, Array.isArray(table.columns) && table.columns.length > 0, "table.columns must include at least one column.");
    issue(errors, Array.isArray(table.rows), "Vue list pages require structured table.rows; prose dataSource is not renderable.");
    issue(errors, table.pagination && typeof table.pagination === "object", "table.pagination is required.");
    (table.columns || []).forEach((column, index) => {
      issue(errors, typeof column.key === "string" && column.key.length > 0, `table.columns[${index}].key is required.`);
      issue(errors, typeof column.label === "string" && column.label.length > 0, `table.columns[${index}].label is required.`);
      if (column.format !== undefined && !LIST_COLUMN_FORMATS.includes(column.format)) {
        errors.push(`table.columns[${index}].format must be one of: ${LIST_COLUMN_FORMATS.join(", ")}.`);
      }
      if (column.fixed !== undefined && !["left", "right"].includes(column.fixed)) {
        errors.push(`table.columns[${index}].fixed must be left or right.`);
      }
      if (column.align !== undefined && !["left", "center", "right"].includes(column.align)) {
        errors.push(`table.columns[${index}].align must be left, center, or right.`);
      }
      if (column.ellipsis !== undefined && typeof column.ellipsis !== "boolean") {
        errors.push(`table.columns[${index}].ellipsis must be a boolean.`);
      }
      if (column.required !== undefined && typeof column.required !== "boolean") {
        errors.push(`table.columns[${index}].required must be a boolean.`);
      }
    });
    const columnKeys = (table.columns || []).map((column) => column.key).filter(Boolean);
    if (new Set(columnKeys).size !== columnKeys.length) errors.push("table.columns keys must be unique.");
    if (table.tools && (!Array.isArray(table.tools) || table.tools.some((tool) => !TABLE_TOOLS.includes(tool)))) {
      errors.push(`Current Vue/Ant list tools only support: ${TABLE_TOOLS.join(", ")}.`);
    }
    if (table.primaryAction !== undefined) validateAction(errors, table.primaryAction, "table.primaryAction");
    if (table.secondaryActions !== undefined) {
      issue(errors, Array.isArray(table.secondaryActions), "table.secondaryActions must be an array.");
      (table.secondaryActions || []).forEach((action, index) => validateAction(errors, action, `table.secondaryActions[${index}]`));
    }
    if (table.selection !== undefined) validateTableSelection(errors, table.selection);
    if (table.batchActions !== undefined) {
      issue(errors, Array.isArray(table.batchActions) && table.batchActions.length > 0, "table.batchActions must be a non-empty array.");
      (table.batchActions || []).forEach((action, index) => validateAction(errors, action, `table.batchActions[${index}]`));
    }
    if (table.selection !== undefined && !(table.batchActions || []).length) {
      errors.push("The current selection renderer requires table.batchActions.");
    }
    if ((table.batchActions || []).length && table.selection === undefined) {
      errors.push("table.batchActions requires table.selection.");
    }
    if (table.expandable !== undefined) validateTableExpandable(errors, table);
    if (table.expandable !== undefined && table.selection !== undefined) {
      errors.push("table.expandable cannot be combined with table.selection in the current renderer.");
    }
    if (table.expandable !== undefined && (table.batchActions || []).length) {
      errors.push("table.expandable cannot be combined with table.batchActions in the current renderer.");
    }
    if (table.rowActions !== undefined) {
      issue(errors, Array.isArray(table.rowActions), "table.rowActions must be an array.");
      (table.rowActions || []).forEach((action, index) => validateAction(errors, action, `table.rowActions[${index}]`));
    }
    (table.rows || []).forEach((row, rowIndex) => {
      issue(errors, row && typeof row === "object", `table.rows[${rowIndex}] must be an object.`);
      if (!row || typeof row !== "object") return;
      issue(errors, row[table.rowKey] !== undefined && row[table.rowKey] !== null && row[table.rowKey] !== "", `table.rows[${rowIndex}] must declare ${table.rowKey}.`);
      if (row.actions !== undefined) {
        issue(errors, Array.isArray(row.actions), `table.rows[${rowIndex}].actions must be an array.`);
        (row.actions || []).forEach((action, actionIndex) => validateAction(errors, action, `table.rows[${rowIndex}].actions[${actionIndex}]`));
      }
      const expandable = table.expandable;
      const childTable = expandable?.childTable;
      const childRowsKey = expandable?.childRowsKey;
      if (typeof childRowsKey === "string" && childRowsKey.length) {
        const childRows = row[childRowsKey];
        issue(errors, Array.isArray(childRows), `table.rows[${rowIndex}].${childRowsKey} must be an array.`);
        if (Array.isArray(childRows) && typeof childTable?.rowKey === "string" && childTable.rowKey.length) {
          childRows.forEach((childRow, childIndex) => {
            issue(errors, childRow && typeof childRow === "object", `table.rows[${rowIndex}].${childRowsKey}[${childIndex}] must be an object.`);
            if (!childRow || typeof childRow !== "object") return;
            issue(errors, childRow[childTable.rowKey] !== undefined && childRow[childTable.rowKey] !== null && childRow[childTable.rowKey] !== "", `table.rows[${rowIndex}].${childRowsKey}[${childIndex}] must declare ${childTable.rowKey}.`);
          });
          const childKeys = childRows
            .filter((childRow) => childRow && typeof childRow === "object" && childRow[childTable.rowKey] !== undefined && childRow[childTable.rowKey] !== null && childRow[childTable.rowKey] !== "")
            .map((childRow) => childRow[childTable.rowKey]);
          if (new Set(childKeys).size !== childKeys.length) errors.push(`table.rows[${rowIndex}].${childRowsKey} ${childTable.rowKey} values must be unique.`);
        }
      }
    });
    const recordKeys = (table.rows || [])
      .filter((row) => row && typeof row === "object" && row[table.rowKey] !== undefined && row[table.rowKey] !== null && row[table.rowKey] !== "")
      .map((row) => row[table.rowKey]);
    if (new Set(recordKeys).size !== recordKeys.length) errors.push("table rowKey values must be unique.");
    const actionColumn = (table.columns || []).find((column) => column.key === "actions");
    const hasActions = (table.rowActions || []).length > 0 || (table.rows || []).some((row) => (row.actions || []).length > 0);
    if (hasActions && !actionColumn) errors.push("table row actions require an actions column.");
    if (actionColumn && !hasActions) errors.push("table.actions column requires rowActions or row-specific actions.");
    const pagination = table.pagination || {};
    if (pagination.pageSize !== undefined && (!Number.isInteger(pagination.pageSize) || pagination.pageSize < 1)) {
      errors.push("table.pagination.pageSize must be a positive integer.");
    }
    if (pagination.total !== undefined && (!Number.isInteger(pagination.total) || pagination.total < 0)) {
      errors.push("table.pagination.total must be a non-negative integer.");
    }
    const pageSize = pagination.pageSize || 20;
    const total = pagination.total ?? (table.rows || []).length;
    const expectedPageCount = Math.max(1, Math.ceil(total / pageSize));
    if (pagination.pageCount !== undefined && pagination.pageCount !== expectedPageCount) {
      errors.push(`table.pagination.pageCount must equal ${expectedPageCount} for the declared total and pageSize.`);
    }
    if (pagination.page !== undefined && (!Number.isInteger(pagination.page) || pagination.page < 1 || pagination.page > expectedPageCount)) {
      errors.push("table.pagination.page must be within the declared page count.");
    }
    if (pagination.total !== undefined && total !== (table.rows || []).length) {
      errors.push("The current client-side list renderer requires table.pagination.total to equal table.rows.length.");
    }
    if (table.summary !== undefined) {
      issue(errors, table.summary && typeof table.summary === "object", "table.summary must be an object.");
      if (table.summary?.items !== undefined) {
        issue(errors, Array.isArray(table.summary.items) && table.summary.items.length >= 1 && table.summary.items.length <= 2, "table.summary.items must contain 1 to 2 compact summary items; use statistics cards for 3 or more metrics.");
        (table.summary.items || []).forEach((item, index) => {
          issue(errors, LIST_SUMMARY_TYPES.includes(item?.type), `table.summary.items[${index}].type must be one of: ${LIST_SUMMARY_TYPES.join(", ")}.`);
          issue(errors, typeof item?.label === "string" && item.label.length > 0, `table.summary.items[${index}].label is required.`);
          if (item?.type === "sum") issue(errors, typeof item.field === "string" && item.field.length > 0, `table.summary.items[${index}].field is required for sum.`);
          if (item?.type === "value") {
            issue(errors, typeof item.value === "number" && Number.isFinite(item.value), `table.summary.items[${index}].value must be a finite number for value.`);
            issue(errors, typeof item.suffix === "string" && item.suffix.length > 0, `table.summary.items[${index}].suffix is required for value.`);
            if (item.field !== undefined || item.equals !== undefined) {
              errors.push(`table.summary.items[${index}] value must not declare field or equals.`);
            }
          }
          if (item?.field !== undefined && typeof item.field !== "string") errors.push(`table.summary.items[${index}].field must be text when supplied.`);
        });
      }
    }
    if (table.summaryTemplate !== undefined && typeof table.summaryTemplate !== "string") {
      errors.push("table.summaryTemplate must be text when supplied.");
    }
    if (table.sectionTitle !== undefined && (typeof table.sectionTitle !== "string" || !table.sectionTitle.length)) {
      errors.push("table.sectionTitle must be non-empty text when supplied.");
    }
  }
  validateStatistics(errors, spec);
  validateListWorkflow(errors, spec);
  if (spec.statistics && (table.summary?.items?.length || table.summaryTemplate)) {
    errors.push("List pages must use either compact table.summary or statistics cards, not both.");
  }
}

function validateListCapabilityUsage(errors, spec) {
  const capabilities = spec.content?.capabilities || [];
  const query = spec.query || {};
  const table = spec.table || {};
  const fields = query.fields || [];
  const columns = table.columns || [];
  const collapseThreshold = query.collapseThreshold || 6;
  const explicitAdvancedFields = fields.filter((field) => field.advanced);
  const automaticallyCollapsible = fields.length > collapseThreshold;
  const dateRangeUsed = fields.some((field) => field.control === "date-range");
  const tagUsed = columns.some((column) => column.format === "tag");
  const statusUsed = columns.some((column) => column.format === "status");
  const amountUsed = columns.some((column) => column.format === "amount");
  const linkUsed = columns.some((column) => column.format === "link");
  const actionColumn = columns.find((column) => column.key === "actions");
  const fixedActionsUsed = actionColumn?.fixed === "right";
  const hasConfirm = (table.rowActions || []).some((action) => action.confirm)
    || (table.rows || []).some((row) => (row.actions || []).some((action) => action.confirm))
    || (table.batchActions || []).some((action) => action.confirm);
  const hasSummaryAmount = (table.summary?.items || []).some((item) => item.type === "sum");
  const hasSummaryCount = Boolean(table.summaryTemplate)
    || (table.summary?.items || []).some((item) => ["count", "active", "value"].includes(item.type));
  const toolbarUsed = Boolean(table.primaryAction)
    || Boolean(table.secondaryActions?.length)
    || Boolean(table.batchActions?.length)
    || Boolean(table.tools?.length);
  const statisticsUsed = Boolean(spec.statistics);
  const richStatisticsUsed = spec.statistics?.layout === "rich";
  const selectionUsed = table.selection !== undefined;
  const batchActionsUsed = Boolean(table.batchActions?.length);
  const expandableUsed = table.expandable !== undefined;
  const createDrawerUsed = Boolean(spec.workflow?.createDrawer);
  const detailDrawerUsed = Boolean(spec.workflow?.detailDrawer);

  if (capabilities.includes("query.basic")) {
    if (explicitAdvancedFields.length) errors.push("query.basic cannot use fields marked advanced.");
    if (query.collapsible === true || query.collapsible === "auto") errors.push("query.basic cannot enable collapse; use query.advanced.");
    if (fields.length > collapseThreshold) errors.push("query.basic supports at most the configured collapse threshold of fields; use query.advanced.");
  }
  if (capabilities.includes("query.advanced")) {
    if (query.collapsible !== true && query.collapsible !== "auto") {
      errors.push("query.advanced requires query.collapsible=true or auto.");
    }
    if (!explicitAdvancedFields.length && !automaticallyCollapsible) {
      errors.push("query.advanced needs explicit advanced fields or more fields than query.collapseThreshold.");
    }
  }
  if (query.collapsible === true && !explicitAdvancedFields.length && !automaticallyCollapsible) {
    errors.push("query.collapsible=true needs explicit advanced fields or more fields than query.collapseThreshold.");
  }

  usesCapability(errors, capabilities, dateRangeUsed, "query.dateRange");
  usesCapability(errors, capabilities, Boolean(query.quickRanges?.length), "query.quickRanges");
  usesCapability(errors, capabilities, tagUsed, "table.tags");
  usesCapability(errors, capabilities, statusUsed, "table.status");
  usesCapability(errors, capabilities, amountUsed, "table.amount");
  usesCapability(errors, capabilities, linkUsed, "table.link");
  usesCapability(errors, capabilities, fixedActionsUsed, "table.fixedActions");
  usesCapability(errors, capabilities, hasConfirm, "table.confirmAction");
  usesCapability(errors, capabilities, selectionUsed, "table.selection");
  usesCapability(errors, capabilities, batchActionsUsed, "table.batchActions");
  usesCapability(errors, capabilities, expandableUsed, "table.expandable");
  usesCapability(errors, capabilities, (table.tools || []).includes("export"), "table.export");
  usesCapability(errors, capabilities, (table.tools || []).includes("refresh"), "table.refresh");
  usesCapability(errors, capabilities, (table.tools || []).includes("settings"), "table.columnSettings");
  usesCapability(errors, capabilities, hasSummaryCount, "summary.count");
  usesCapability(errors, capabilities, hasSummaryAmount, "summary.amount");
  usesCapability(errors, capabilities, statisticsUsed, "statistics.cards");
  usesCapability(errors, capabilities, richStatisticsUsed, "statistics.cards.rich");
  usesCapability(errors, capabilities, createDrawerUsed, "list.workflow.createDrawer");
  usesCapability(errors, capabilities, detailDrawerUsed, "list.workflow.detailDrawer");
  usesCapability(errors, capabilities, toolbarUsed, "table.toolbar");
  usesCapability(errors, capabilities, Boolean(table.pagination), "table.pagination");
}

export function validateVueAntPageSpec(spec, options = {}) {
  const errors = [];
  issue(errors, spec && typeof spec === "object", "Page Spec must be a YAML object.");
  if (!spec || typeof spec !== "object") return errors;

  issue(errors, spec.ui?.platform === "admin-pc-ant", "ui.platform must be admin-pc-ant.");
  issue(errors, spec.ui?.runtime === VUE_ANT_RUNTIME, "ui.runtime must be vue-ant.");
  issue(errors, Number(spec.ui?.rendererVersion) === VUE_ANT_RENDERER_VERSION, `ui.rendererVersion must be ${VUE_ANT_RENDERER_VERSION}.`);
  issue(errors, ["form", "list", "detail", "result"].includes(spec.page?.family), "page.family must be form, list, detail, or result for the Vue/Ant renderer.");
  issue(errors, Array.isArray(spec.content?.capabilities), "content.capabilities must be an array.");

  const family = spec.page?.family;
  const capabilities = spec.content?.capabilities || [];
  if (family && SUPPORTED_CAPABILITIES[family]) {
    const unsupported = capabilities.filter((capability) => !SUPPORTED_CAPABILITIES[family].has(capability));
    if (unsupported.length) errors.push(`Current Vue/Ant renderer does not support: ${unsupported.join(", ")}.`);
  }

  if (family === "form" && !capabilities.some((capability) => ["form.simple", "form.steps", "form.groups"].includes(capability))) {
    errors.push("Form pages require form.simple, form.steps, or form.groups.");
  }
  if (family === "list") {
    const queryCapabilityCount = capabilities.filter((capability) => ["query.basic", "query.advanced"].includes(capability)).length;
    if (queryCapabilityCount !== 1) errors.push("List pages require exactly one of query.basic or query.advanced.");
    if (!capabilities.includes("table.flat")) errors.push("List pages require table.flat.");
  }

  if (family === "form") {
    validateForm(errors, spec);
    validateFormTemplate(errors, spec, options);
  }
  if (family !== "form" && spec.template !== undefined) {
    errors.push("template is currently supported only for form pages.");
  }
  if (family === "list") {
    validateList(errors, spec);
    validateListCapabilityUsage(errors, spec);
  }
  if (family === "detail") validateDetail(errors, spec);
  if (family === "result") validateResult(errors, spec);
  return errors;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function toVueAntPageDeclaration(spec) {
  const errors = validateVueAntPageSpec(spec);
  if (errors.length) throw new Error(errors.join("\n"));

  const declaration = {
    schemaVersion: VUE_ANT_RENDERER_VERSION,
    runtime: VUE_ANT_RUNTIME,
    page: {
      name: spec.page.name || "未命名页面",
      family: spec.page.family,
      presentation: spec.page.presentation || "page"
    },
    content: {
      capabilities: clone(spec.content.capabilities),
      states: clone(spec.content.states || [])
    }
  };

  if (spec.page.family === "form") {
    if (spec.template?.id) declaration.template = clone(spec.template);
    declaration.form = clone(spec.form);
    declaration.illustration = clone(spec.illustration || {});
  }

  if (spec.page.family === "list") {
    declaration.query = clone(spec.query);
    declaration.table = clone(spec.table);
    declaration.statistics = clone(spec.statistics || {});
    declaration.workflow = clone(spec.workflow || {});
  }

  if (spec.page.family === "detail") {
    declaration.detail = clone(spec.detail);
  }

  if (spec.page.family === "result") {
    declaration.result = clone(spec.result);
  }

  return declaration;
}

export function pageContentFromVueAntDeclaration(declaration) {
  const json = JSON.stringify(declaration, null, 2).replace(/</g, "\\u003c");
  return `<section id="page-content" class="page" data-runtime="vue-ant">\n  <div data-admin-pc-vue-root></div>\n  <script type="application/json" data-admin-pc-vue-page>\n${json}\n  </script>\n</section>\n`;
}

export function writeVueAntPageContent(outputFile, declaration) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, pageContentFromVueAntDeclaration(declaration));
}
