import { computed, createApp, defineComponent, h, reactive, ref } from "vue";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Popover,
  Radio,
  Result,
  Select,
  Steps,
  Tag,
  Table,
  Tabs,
  Tooltip,
  Upload
} from "ant-design-vue";
import {
  DownloadOutlined,
  FrownOutlined,
  HolderOutlined,
  InfoCircleOutlined,
  LikeOutlined,
  MehOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  SmileOutlined,
  UploadOutlined
} from "@ant-design/icons-vue";
import dayjs from "dayjs";
import "./page-runtime.css";

const ANT_THEME = {
  token: {
    colorPrimary: "#F36046",
    colorInfo: "#F36046",
    colorSuccess: "#26a269",
    colorText: "#1f2329",
    colorTextSecondary: "#86909c",
    colorBorder: "#d9dfe8",
    colorBgLayout: "rgba(0, 0, 0, 0.04)",
    borderRadius: 4,
    controlHeight: 40,
    fontFamily: "PingFang SC, Microsoft YaHei, Arial, sans-serif",
    fontSize: 14
  },
  components: {
    Button: { primaryShadow: "none" },
    Table: { headerBg: "#f6f7f9", headerColor: "#1f2329" }
  }
};

function fieldDefault(field) {
  if (field.default !== undefined) return Array.isArray(field.default) ? [...field.default] : field.default;
  if (field.control === "select") return undefined;
  if (field.control === "upload") return [];
  return "";
}

function buildFormRules(field) {
  const rules = [];
  if (field.required && field.control === "upload") {
    rules.push({
      validator: (_rule, value) => Array.isArray(value) && value.length
        ? Promise.resolve()
        : Promise.reject(new Error(`请上传${field.label}`))
    });
  } else if (field.required) {
    rules.push({ required: true, message: `请${field.control === "select" || field.control === "radio" ? "选择" : "输入"}${field.label}` });
  }

  if (field.validationRules?.pattern) {
    rules.push({ pattern: new RegExp(field.validationRules.pattern), message: field.validationRules.message || `${field.label}格式不正确` });
  }

  if (field.key === "bankAccountNumber") {
    rules.push({ pattern: /^\d{10,19}$/, message: "请输入 10-19 位有效账户号码" });
  }

  return rules;
}

function buildInitialModel(fields) {
  return fields.reduce((model, field) => {
    if (field.control !== "static") model[field.key] = fieldDefault(field);
    return model;
  }, {});
}

function modeTabItems(form) {
  return form?.modeTabs?.items || [];
}

function formGroups(form) {
  return form?.groups || [];
}

function allFormFields(form) {
  return [
    ...(form?.fields || []),
    ...formGroups(form).flatMap((group) => group.fields || []),
    ...modeTabItems(form).flatMap((item) => item.fields || [])
  ];
}

function formEffectExists(config, fieldKey, effect) {
  return config.form?.interactions?.some((item) => item.on === fieldKey && item.effect === effect) || false;
}

function formatFormValue(field, value) {
  if (field.control === "static") return field.value || "-";
  if (value === undefined || value === null || value === "") return "-";
  if (field.control === "radio" || field.control === "select") {
    return field.options?.find((option) => option.value === value)?.label || String(value);
  }
  if (field.control === "upload") return Array.isArray(value) && value.length ? value.map((file) => file.name).join("、") : "-";
  return String(value);
}

function normalizeResultAction(action, fallbackKey) {
  if (typeof action === "string") return { key: fallbackKey, label: action };
  if (action && typeof action === "object") return { key: action.key || fallbackKey, label: action.label };
  return null;
}

function renderFormControl(field, model, updateField, runAction) {
  if (field.control === "static") {
    return h("div", { class: "vue-ant-static-value" }, field.value || "-");
  }

  if (field.control === "radio") {
    return h(Radio.Group, {
      value: model[field.key],
      "onUpdate:value": (value) => updateField(field, value)
    }, {
      default: () => (field.options || []).map((option) => h(Radio, { value: option.value }, { default: () => option.label }))
    });
  }

  if (field.control === "select") {
    return h(Select, {
      allowClear: !field.required,
      options: (field.options || []).map((option) => ({ label: option.label, value: option.value, disabled: option.disabled })),
      placeholder: field.placeholder || "请选择",
      value: model[field.key],
      "onUpdate:value": (value) => updateField(field, value)
    });
  }

  if (field.control === "upload") {
    const fileList = Array.isArray(model[field.key]) ? model[field.key] : [];
    return h("div", { class: "vue-ant-upload-control" }, [
      h(Upload, {
        accept: field.accept?.join(","),
        beforeUpload: () => false,
        fileList,
        maxCount: field.maxCount || 1,
        "onUpdate:fileList": (nextFileList) => updateField(field, nextFileList),
        onChange: (info) => updateField(field, info.fileList || [])
      }, {
        default: () => h(Button, { icon: h(UploadOutlined) }, { default: () => field.buttonLabel || "上传文件" })
      }),
      field.templateAction ? h(Button, {
        onClick: () => runAction(field.templateAction),
        type: "link"
      }, { default: () => field.templateAction.label }) : null
    ]);
  }

  const numericAccount = field.key === "bankAccountNumber";
  return h(Input, {
    autocomplete: "off",
    inputmode: numericAccount ? "numeric" : undefined,
    maxlength: field.maxLength,
    placeholder: field.placeholder || `请输入${field.label}`,
    value: model[field.key],
    "onUpdate:value": (value) => {
      const normalized = numericAccount ? String(value).replace(/[\s-]/g, "").replace(/\D/g, "") : value;
      updateField(field, normalized);
    }
  });
}

function formatReviewValue(value, column = {}) {
  if (value === undefined || value === null || value === "") return "-";
  if (column.format === "datetime") {
    const date = dayjs(value);
    return date.isValid() ? date.format(column.dateFormat || "YYYY-MM-DD HH:mm:ss") : String(value);
  }
  if (column.format === "amount") {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "-";
    const precision = Number.isInteger(column.precision) ? column.precision : 2;
    const formatted = new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(Math.abs(amount));
    const sign = amount < 0 ? "-" : "";
    const prefix = column.currency === "CNY" && column.currencyDisplay === "prefix" ? "¥" : "";
    return `${sign}${prefix}${formatted}`;
  }
  return String(value);
}

function makeReviewColumns(columns) {
  return columns.map((column) => ({
    align: column.align || (column.format === "amount" ? "right" : undefined),
    dataIndex: column.key,
    ellipsis: Boolean(column.ellipsis),
    key: column.key,
    title: column.label,
    width: column.width,
    customRender: ({ text }) => h("span", { class: column.ellipsis ? "vue-ant-ellipsis" : undefined }, formatReviewValue(text, column))
  }));
}

const FormPage = defineComponent({
  name: "AdminPcAntFormPage",
  props: { config: { type: Object, required: true } },
  setup(props) {
    const formConfig = props.config.form || {};
    const commonFields = formConfig.fields || [];
    const groups = formGroups(formConfig);
    const groupedLayout = groups.length > 0;
    const modeItems = modeTabItems(formConfig);
    const allFields = allFormFields(formConfig);
    const formRef = ref();
    const model = reactive(buildInitialModel(allFields));
    const failureOpen = ref(false);
    const submitting = ref(false);
    const feedback = ref("");
    const completionOpen = ref(false);
    const flowStage = ref("entry");
    const activeMode = ref(formConfig.modeTabs?.defaultKey || modeItems[0]?.key || "");
    const activeModeConfig = computed(() => modeItems.find((item) => item.key === activeMode.value));
    const fields = computed(() => [...commonFields, ...(activeModeConfig.value?.fields || [])]);
    const isUploadFlow = computed(() => Boolean(formConfig.uploadFlow));
    const isStagedConfiguration = computed(() => props.config.template?.id === "form.staged-configuration" && !isUploadFlow.value);
    const activeStageIndex = ref(Math.max(0, (formConfig.steps || []).findIndex((step) => step.status === "process")));
    const activeStage = computed(() => (formConfig.steps || [])[activeStageIndex.value]);
    const confirmation = computed(() => formConfig.confirmation || {});
    const isConfirmationStage = computed(() => isStagedConfiguration.value && activeStage.value?.key === confirmation.value.step);
    const stageFields = computed(() => {
      if (!isStagedConfiguration.value) return fields.value;
      const keys = activeStage.value?.fieldKeys || [];
      return fields.value.filter((field) => keys.includes(field.key));
    });
    const requiredKeys = computed(() => {
      if (isStagedConfiguration.value) return stageFields.value.filter((field) => field.required).map((field) => field.key);
      return activeModeConfig.value?.disabledUntil || formConfig.submit?.disabledUntil || [];
    });

    const clearEditableFields = (exceptKey) => {
      allFields.forEach((field) => {
        if (field.control !== "static" && field.key !== exceptKey) model[field.key] = fieldDefault(field);
      });
      formRef.value?.clearValidate?.();
      feedback.value = "已清空下方可编辑字段，请重新填写。";
    };

    const updateField = (field, value) => {
      model[field.key] = value;
      if (formEffectExists(props.config, field.key, "clear-editable-fields")) clearEditableFields(field.key);
    };

    const updateMode = (key) => {
      if (key === activeMode.value || !modeItems.some((item) => item.key === key)) return;
      modeItems.flatMap((item) => item.fields || []).forEach((field) => { model[field.key] = fieldDefault(field); });
      activeMode.value = key;
      formRef.value?.clearValidate?.();
      feedback.value = "已切换录入方式，请完成当前方式所需信息。";
    };

    const shouldSimulateFailure = () => {
      const simulation = formConfig.submit?.failureSimulation;
      if (!simulation?.field || !simulation.endsWith) return false;
      return String(model[simulation.field] || "").endsWith(String(simulation.endsWith));
    };

    const validateCurrentStage = async () => {
      try {
        if (isStagedConfiguration.value) {
          await formRef.value?.validateFields?.(stageFields.value.map((field) => field.key));
        } else {
          await formRef.value?.validate?.();
        }
      } catch (error) {
        const firstError = error?.errorFields?.[0]?.name;
        const firstField = Array.isArray(firstError) ? firstError[0] : firstError;
        if (firstField) formRef.value?.scrollToField?.(firstField, { block: "center", focus: true });
        return false;
      }
      return true;
    };

    const submit = async () => {
      if (!isConfirmationStage.value && !(await validateCurrentStage())) return;

      if (shouldSimulateFailure()) {
        failureOpen.value = true;
        return;
      }

      if (isUploadFlow.value) {
        flowStage.value = "review";
        feedback.value = "";
        return;
      }

      if (isStagedConfiguration.value && formConfig.submit?.result) {
        completionOpen.value = true;
        feedback.value = "";
        return;
      }

      submitting.value = true;
      feedback.value = "四要素校验通过，正在进入下一步…";
      window.setTimeout(() => { submitting.value = false; }, 700);
    };

    const advanceStage = async () => {
      if (!isStagedConfiguration.value || isConfirmationStage.value) {
        await submit();
        return;
      }
      if (!(await validateCurrentStage())) return;
      if (activeStageIndex.value < (formConfig.steps || []).length - 1) {
        activeStageIndex.value += 1;
        feedback.value = "";
      }
    };

    const previousStage = () => {
      if (activeStageIndex.value <= 0) return;
      activeStageIndex.value -= 1;
      feedback.value = "";
    };

    const requiredComplete = computed(() => requiredKeys.value.every((key) => {
      const value = model[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && String(value).trim() !== "";
    }));

    const runAction = (action) => {
      feedback.value = `已触发${action.label}操作。`;
    };

    const flowStepIndex = () => {
      if (isStagedConfiguration.value) return activeStageIndex.value;
      if (!isUploadFlow.value) return Math.max(0, (formConfig.steps || []).findIndex((step) => step.status === "process"));
      if (flowStage.value === "review") return 1;
      if (flowStage.value === "result") return 2;
      return 0;
    };

    const renderStickyActions = (secondaryActions, primaryAction) => h("div", { class: "vue-ant-sticky-actions" }, [
      h("div", { class: "vue-ant-sticky-actions-secondary" }, secondaryActions),
      h("div", { class: "vue-ant-sticky-actions-primary" }, [primaryAction])
    ]);

    const renderEntryActions = (sticky = false) => {
      const actions = formConfig.actions || {};
      const declaredSecondaryActions = (actions.secondaryActions || []).map((action) => h(Button, {
          onClick: () => runAction(action)
        }, { default: () => action.label }));
      const secondaryActions = isStagedConfiguration.value && activeStageIndex.value > 0
        ? [h(Button, { onClick: previousStage }, { default: () => "上一步" }), ...declaredSecondaryActions]
        : declaredSecondaryActions;
      const isFinalStage = !isStagedConfiguration.value || isConfirmationStage.value;
      const primaryAction = h(Button, {
          disabled: (!isConfirmationStage.value && !requiredComplete.value) || submitting.value,
          loading: submitting.value,
          onClick: isStagedConfiguration.value ? advanceStage : submit,
          type: "primary"
        }, {
          default: () => {
            if (submitting.value) return "正在校验";
            if (!isFinalStage) return "下一步";
            return actions.primaryLabel || "提交";
          }
        });
      if (sticky) return renderStickyActions(secondaryActions, primaryAction);
      return h("div", { class: "vue-ant-form-actions" }, [primaryAction, ...secondaryActions]);
    };

    const renderReview = () => {
      const review = formConfig.uploadFlow?.review || {};
      return h("section", { class: "vue-ant-flow-review" }, [
        h(Alert, {
          class: "vue-ant-flow-validation",
          message: review.validationMessage,
          showIcon: true,
          type: "success"
        }),
        h(Table, {
          columns: makeReviewColumns(review.columns || []),
          dataSource: review.rows || [],
          pagination: false,
          rowKey: review.rowKey || "id",
          scroll: (review.columns || []).length > 6 ? { x: "max-content" } : undefined,
          size: "middle"
        }),
        h("div", { class: "vue-ant-flow-review-summary" }, (review.summary?.items || []).map((item) => h("span", { class: "vue-ant-flow-summary-item" }, [
          h("strong", `${item.label}: `),
          item.value
        ]))),
        renderStickyActions(
          [h(Button, { onClick: () => { flowStage.value = "entry"; } }, { default: () => review.previousLabel || "上一步" })],
          h(Button, { onClick: () => { flowStage.value = "result"; }, type: "primary" }, { default: () => review.confirmLabel || "确认" })
        )
      ]);
    };

    const renderResult = () => {
      const result = formConfig.uploadFlow?.result || {};
      return h("section", { class: "vue-ant-flow-result" }, [
        h(Result, {
          status: "success",
          subTitle: result.subtitle,
          title: result.title
        }),
        h("div", { class: "vue-ant-flow-result-summary" }, (result.summaryItems || []).map((item) => h("div", { class: "vue-ant-flow-result-summary-item" }, [
          h("span", item.label),
          h("strong", item.value)
        ]))),
        h("div", { class: "vue-ant-flow-result-actions" }, [
          h(Button, { onClick: () => runAction(result.actions?.primary), type: "primary" }, { default: () => result.actions?.primary?.label }),
          h(Button, { onClick: () => runAction(result.actions?.secondary) }, { default: () => result.actions?.secondary?.label })
        ])
      ]);
    };

    return () => {
      if (completionOpen.value) {
        const completionResult = formConfig.submit?.result || {};
        return h(ResultPage, {
          config: {
            result: {
              ...completionResult,
              actions: completionResult.actions || { primary: "返回上一页" }
            }
          }
        });
      }
      const steps = formConfig.steps || [];
      const activeStep = flowStepIndex();
      const illustration = props.config.illustration || {};
      const copy = illustration.copy || {};
      const hasIllustration = flowStage.value === "entry" && (props.config.content?.capabilities?.includes("form.sideIllustration") || Boolean(illustration.assetKey || copy.title || copy.description));
      const renderFormItem = (field) => h(FormItem, {
        key: field.key,
        label: field.label,
        name: field.key,
        required: field.required,
        rules: buildFormRules(field)
      }, {
        default: () => [
          renderFormControl(field, model, updateField, runAction),
          field.helperText ? h("p", { class: "ant-form-item-extra" }, field.helperText) : null
        ]
      });
      const formItems = stageFields.value.map((field) => renderFormItem(field));
      const groupNodes = groups.map((group) => h(Card, {
        bordered: false,
        class: "vue-ant-form-group-card"
      }, {
        default: () => [
          h("div", { class: "vue-ant-form-group-header" }, [
            h("h2", { class: "vue-ant-form-group-title" }, group.title),
            group.description ? h("p", { class: "vue-ant-form-group-description" }, group.description) : null
          ]),
          h("div", {
            class: "vue-ant-form-group-grid",
            style: { "--vue-ant-form-columns": group.columns || formConfig.columns || 2 }
          }, (group.fields || []).map((field) => h("div", {
            class: "vue-ant-form-group-field",
            style: { "--vue-ant-form-field-span": field.span || 1 }
          }, [renderFormItem(field)])))
        ]
      }));

      const modeTabs = formConfig.modeTabs;
      const modeTabsNode = modeTabs?.items?.length ? h(Tabs, {
        activeKey: activeMode.value,
        class: "vue-ant-form-mode-tabs",
        destroyInactiveTabPane: true,
        "onUpdate:activeKey": updateMode
      }, {
        default: () => modeTabs.items.map((item) => h(Tabs.TabPane, {
          key: item.key,
          tab: item.label
        }))
      }) : null;

      const stickyActions = formConfig.actions?.placement === "sticky-end";
      const confirmationFields = (confirmation.value.fields || [])
        .map((key) => allFields.find((field) => field.key === key))
        .filter(Boolean);
      const confirmationNode = h("section", { class: "vue-ant-form-confirmation" }, [
        h("h2", { class: "vue-ant-form-section-title" }, confirmation.value.title || "确认信息"),
        h(Descriptions, {
          bordered: true,
          class: "vue-ant-form-confirmation-descriptions",
          column: 1,
          size: "middle"
        }, {
          default: () => confirmationFields.map((field) => h(DescriptionsItem, {
            key: field.key,
            label: field.label
          }, { default: () => formatFormValue(field, model[field.key]) }))
        })
      ]);

      const formMain = h("div", { class: "vue-ant-form-main" }, [
        modeTabsNode,
        isConfirmationStage.value ? confirmationNode : [
          h("h2", { class: "vue-ant-form-section-title" }, formConfig.sectionTitle || activeStage.value?.title || "账户信息"),
          h(Form, {
            class: ["vue-ant-form", { "is-grouped": groupedLayout }],
            colon: false,
            labelAlign: groupedLayout ? "left" : "right",
            labelCol: groupedLayout ? undefined : { flex: "108px" },
            layout: groupedLayout ? "vertical" : "horizontal",
            model,
            ref: formRef,
            wrapperCol: groupedLayout ? undefined : { flex: "1" }
          }, {
            default: () => groupedLayout ? [
              formItems.length ? h("div", { class: "vue-ant-form-common-fields" }, formItems) : null,
              h("div", { class: "vue-ant-form-groups" }, groupNodes)
            ] : formItems
          })
        ],
        stickyActions ? null : renderEntryActions(),
        feedback.value ? h("p", { class: "vue-ant-feedback", "aria-live": "polite" }, feedback.value) : null
      ]);

      const helpPanel = h("aside", { class: "vue-ant-illustration" }, [
        h("div", { class: "vue-ant-illustration-placeholder", role: "img", "aria-label": copy.ariaLabel || "业务说明配图占位" }, copy.placeholderLabel || "配图占位"),
        h("h2", copy.title || "产品或服务标题"),
        h("p", copy.description || "请仔细核对资金相关信息后再提交。")
      ]);

      const failureModal = h(Modal, {
        cancelText: "返回修改",
        centered: true,
        okButtonProps: { style: { display: "none" } },
        onCancel: () => { failureOpen.value = false; },
        open: failureOpen.value,
        title: "账户信息校验失败"
      }, {
        default: () => h("p", "银行卡四要素信息不匹配，请核对账户名称、开户行、账户号码与法人实名后重试。"),
        footer: () => h(Button, { onClick: () => { failureOpen.value = false; }, type: "primary" }, { default: () => "返回修改" })
      });

      const entry = h("div", { class: "vue-ant-form-entry" }, [
        h("section", { class: ["vue-ant-form-layout", { "is-simple": !hasIllustration, "is-grouped": groupedLayout }] }, hasIllustration ? [formMain, helpPanel] : [formMain]),
        stickyActions ? renderEntryActions(true) : null
      ]);
      const flowContent = flowStage.value === "review"
        ? renderReview()
        : flowStage.value === "result"
          ? renderResult()
          : entry;

      return h("div", { class: ["vue-ant-page", "vue-ant-form-page", { "is-grouped-page": groupedLayout }] }, [
        steps.length ? h(Steps, {
          class: "vue-ant-steps",
          current: activeStep,
          items: steps.map((step) => ({ title: step.title, description: step.description, status: isUploadFlow.value ? undefined : step.status === "wait" ? "wait" : undefined }))
        }) : null,
        flowContent,
        failureModal
      ]);
    };
  }
});

const QUICK_RANGE_LABELS = {
  today: "今日",
  yesterday: "昨日",
  last3days: "近3日",
  last7days: "近7日",
  last30days: "近30日"
};

const TABLE_SELECTION_QUICK_LABELS = {
  "all-results": "全选查询结果",
  "current-page": "选择当前页",
  "invert-current-page": "反选当前页",
  clear: "清空所选"
};

function quickRangeValue(key) {
  const now = dayjs();
  if (key === "yesterday") {
    const day = now.subtract(1, "day");
    return [day.startOf("day"), day.endOf("day")];
  }
  if (key === "last3days") return [now.subtract(2, "day").startOf("day"), now.endOf("day")];
  if (key === "last7days") return [now.subtract(6, "day").startOf("day"), now.endOf("day")];
  if (key === "last30days") return [now.subtract(29, "day").startOf("day"), now.endOf("day")];
  return [now.startOf("day"), now.endOf("day")];
}

function normalizeDateRange(value) {
  if (!value) return undefined;
  if (typeof value === "string" && QUICK_RANGE_LABELS[value]) return quickRangeValue(value);
  const rawRange = Array.isArray(value) ? value : [value.start, value.end];
  if (!rawRange[0] || !rawRange[1]) return undefined;
  const range = rawRange.map((item) => dayjs(item));
  return range.every((item) => item.isValid()) ? range : undefined;
}

function queryFieldDefault(field, query) {
  if (field.control === "date-range") {
    return normalizeDateRange(field.default || query?.defaultQuickRange);
  }
  return field.default ?? (field.control === "select" ? undefined : "");
}

function cloneQueryValue(field, value) {
  if (field.control === "date-range" && Array.isArray(value)) return [...value];
  return value;
}

function rowValueMatches(row, field, value) {
  if (value === undefined || value === null || value === "" || value === "all") return true;
  const candidate = row[field.filterKey || field.key];
  if (candidate === undefined || candidate === null) return true;
  if (field.control === "date-range") {
    if (!Array.isArray(value) || value.length !== 2) return true;
    const date = dayjs(candidate);
    return date.isValid() && !date.isBefore(value[0]) && !date.isAfter(value[1]);
  }
  if (field.control === "select") return String(candidate) === String(value);
  return String(candidate).toLowerCase().includes(String(value).toLowerCase());
}

function presentValue(value) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function descriptorFor(value, map = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  const mapped = map[value];
  if (typeof mapped === "string") return { label: mapped, tone: "default" };
  return mapped || { label: presentValue(value), tone: "default" };
}

function renderTextCell(value, column, record, handlers) {
  const dateValue = column.format === "datetime" && value ? dayjs(value) : null;
  const text = dateValue?.isValid() ? dateValue.format(column.dateFormat || "YYYY-MM-DD HH:mm:ss") : presentValue(value);
  if (column.format === "link" && text !== "-") {
    const action = column.action || { key: "detail", label: "查看" };
    return h(Button, {
      class: "vue-ant-cell-link",
      onClick: () => handlers.runAction(action, record),
      size: "small",
      type: "link"
    }, { default: () => text });
  }
  const content = h("span", { class: column.ellipsis ? "vue-ant-ellipsis" : undefined }, text);
  return column.ellipsis && text !== "-" ? h(Tooltip, { title: text }, { default: () => content }) : content;
}

function renderTagCell(value, column) {
  const values = Array.isArray(value) ? value : [value];
  return h("span", { class: "vue-ant-cell-tags" }, values.map((item) => {
    const descriptor = descriptorFor(item, column.tagMap);
    return h(Tag, {
      bordered: false,
      color: descriptor.tone === "default" ? undefined : descriptor.tone
    }, { default: () => descriptor.label || "-" });
  }));
}

function renderStatusCell(value, column) {
  const descriptor = descriptorFor(value, column.statusMap);
  const status = ["success", "error", "processing", "warning", "default"].includes(descriptor.tone) ? descriptor.tone : "default";
  return h(Badge, { status, text: descriptor.label || "-" });
}

function renderAmountCell(value, column) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return h("span", { class: "vue-ant-cell-amount" }, "-");
  const precision = Number.isInteger(column.precision) ? column.precision : 2;
  const absolute = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(Math.abs(amount));
  const sign = amount < 0 ? "-" : column.showSign && amount > 0 ? "+" : "";
  const prefix = column.currencyDisplay === "prefix" && column.currency === "CNY" ? "¥" : "";
  return h("span", {
    class: ["vue-ant-cell-amount", { "is-negative": amount < 0 }]
  }, `${sign}${prefix}${absolute}`);
}

function renderActionButton(action, record, handlers) {
  const button = h(Button, {
    danger: Boolean(action.danger),
    onClick: action.confirm ? undefined : () => handlers.runAction(action, record),
    size: "small",
    type: "link"
  }, { default: () => action.label });
  if (!action.confirm) return button;
  return h(Popconfirm, {
    cancelText: "取消",
    okText: "确认",
    onConfirm: () => handlers.runAction(action, record),
    title: action.confirm
  }, { default: () => button });
}

function renderTableCell(column, value, record, handlers) {
  if (column.key === "actions") {
    const actions = record.actions || handlers.table.rowActions || [];
    return h("span", { class: "vue-ant-row-actions" }, actions.map((action) => renderActionButton(action, record, handlers)));
  }
  if (column.format === "tag") return renderTagCell(value, column);
  if (column.format === "status") return renderStatusCell(value, column);
  if (column.format === "amount") return renderAmountCell(value, column);
  return renderTextCell(value, column, record, handlers);
}

function makeListColumns(orderedColumns, handlers) {
  return orderedColumns.map((column) => ({
    align: column.align || (column.format === "amount" ? "right" : undefined),
    dataIndex: column.key,
    ellipsis: Boolean(column.ellipsis),
    fixed: column.fixed,
    key: column.key,
    title: column.label,
    width: column.width || (column.key === "actions" ? 132 : undefined),
    customRender: ({ text, record }) => renderTableCell(column, text, record, handlers)
  }));
}

function makeChildTableColumns(columns) {
  return columns.map((column) => ({
    align: column.align || (column.format === "amount" ? "right" : undefined),
    dataIndex: column.key,
    ellipsis: Boolean(column.ellipsis),
    key: column.key,
    title: column.label,
    width: column.width,
    customRender: ({ text, record }) => renderTableCell(column, text, record, { runAction: () => {}, table: {} })
  }));
}

function listToolMeta(tool) {
  if (tool === "export") return { icon: DownloadOutlined, label: "导出当前查询结果" };
  if (tool === "refresh") return { icon: ReloadOutlined, label: "刷新表格" };
  return { icon: SettingOutlined, label: "列设置" };
}

function activeSummaryCount(rows, item = {}) {
  if (item.field) {
    const expected = item.equals ?? true;
    return rows.filter((row) => row[item.field] === expected).length;
  }
  return rows.filter((row) => row.active !== false && row.ruleStatus !== "expired").length;
}

function summaryText(table, rows) {
  const activeCount = activeSummaryCount(rows);
  if (table.summary?.items?.length) {
    return table.summary.items.map((item) => {
      if (item.type === "value") return `${item.label} ${item.value}${item.suffix}`;
      if (item.type === "sum") {
        const value = rows.reduce((total, row) => total + (Number(row[item.field]) || 0), 0);
        return `${item.label} ${renderAmountText(value, item)}`;
      }
      if (item.type === "active") return `${item.label} ${activeSummaryCount(rows, item)}${item.suffix || "条"}`;
      return `${item.label} ${rows.length}${item.suffix || "条"}`;
    });
  }
  return table.summaryTemplate
    ? [table.summaryTemplate.replace("{total}", rows.length).replace("{active}", activeCount)]
    : [];
}

function renderAmountText(value, item = {}) {
  const precision = Number.isInteger(item.precision) ? item.precision : 2;
  const absolute = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(Math.abs(value));
  const sign = value < 0 ? "-" : item.showSign && value > 0 ? "+" : "";
  return `${sign}${item.currency === "CNY" && item.currencyDisplay === "prefix" ? "¥" : ""}${absolute}`;
}

function statisticValue(item, rows) {
  if (!item.aggregate) return item.value;
  const aggregate = item.aggregate;
  const scopedRows = aggregate.where
    ? rows.filter((row) => row[aggregate.where.field] === aggregate.where.equals)
    : rows;
  if (aggregate.op === "count") return scopedRows.length;
  return scopedRows.reduce((total, row) => total + (Number(row[aggregate.field]) || 0), 0);
}

function formatStatisticValue(item, rows) {
  const value = statisticValue(item, rows);
  const precision = item.format === "amount" ? 2 : 0;
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision
  }).format(value);
}

function statisticLabel(item) {
  return item.unit ? `${item.label}(${item.unit})` : item.label;
}

const ListPage = defineComponent({
  name: "AdminPcAntListPage",
  props: { config: { type: Object, required: true } },
  setup(props) {
    const query = props.config.query || {};
    const table = props.config.table || {};
    const workflow = props.config.workflow || {};
    const createDrawer = workflow.createDrawer || null;
    const detailDrawer = workflow.detailDrawer || null;
    const createFields = createDrawer?.form?.fields || [];
    const queryFields = query.fields || [];
    const quickRangeField = query.quickRanges?.length
      ? queryFields.find((field) => field.control === "date-range")
      : null;
    const queryModel = reactive(queryFields.reduce((model, field) => {
      model[field.key] = queryFieldDefault(field, query);
      return model;
    }, {}));
    const activeQuickRange = ref(query.defaultQuickRange || (typeof quickRangeField?.default === "string" ? quickRangeField.default : ""));
    const feedback = ref("");
    const currentPage = ref(table.pagination?.page || 1);
    const pageSize = ref(table.pagination?.pageSize || 20);
    const sourceRows = ref(table.rows || []);
    const appliedQuery = ref({});
    const selection = table.selection || null;
    const selectedRowKeys = ref([]);
    const expandable = table.expandable || null;
    const expandedRowKeys = ref([]);
    const defaultColumnOrder = (table.columns || []).map((column) => column.key);
    const columnOrder = ref([...defaultColumnOrder]);
    const visibleColumnKeys = ref(new Set((table.columns || []).filter((column) => column.hidden !== true).map((column) => column.key)));
    const draggedColumnKey = ref("");
    const createDrawerOpen = ref(false);
    const detailDrawerOpen = ref(false);
    const activeDetailRecord = ref(null);
    const createFormRef = ref();
    const createModel = reactive(buildInitialModel(createFields));

    const collapseThreshold = query.collapseThreshold || 6;
    const collapsedFieldKeys = computed(() => {
      const explicit = queryFields.filter((field) => field.advanced).map((field) => field.key);
      if (explicit.length) return new Set(explicit);
      if ((query.collapsible === true || query.collapsible === "auto") && queryFields.length > collapseThreshold) {
        return new Set(queryFields.slice(collapseThreshold).map((field) => field.key));
      }
      return new Set();
    });
    const canToggleQuery = computed(() => query.collapsible !== false && collapsedFieldKeys.value.size > 0);
    const expanded = ref(query.defaultExpanded !== false);
    const visibleFields = computed(() => queryFields.filter((field) => expanded.value || !collapsedFieldKeys.value.has(field.key)));
    const rows = computed(() => sourceRows.value.filter((row) => queryFields.every((field) => rowValueMatches(row, field, appliedQuery.value[field.key]))));
    const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize.value)));
    const pageRows = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      return rows.value.slice(start, start + pageSize.value);
    });
    const selectedCount = computed(() => selectedRowKeys.value.length);
    const orderedColumns = computed(() => {
      const byKey = new Map((table.columns || []).map((column) => [column.key, column]));
      return columnOrder.value
        .map((key) => byKey.get(key))
        .filter((column) => column && visibleColumnKeys.value.has(column.key));
    });
    const displayColumns = computed(() => makeListColumns(orderedColumns.value, { runAction, table }));
    const rowSelection = computed(() => {
      if (!selection) return undefined;
      return {
        checkStrictly: true,
        columnWidth: 48,
        fixed: "left",
        preserveSelectedRowKeys: true,
        selectedRowKeys: selectedRowKeys.value,
        selections: (selection.quickActions || []).map((key) => ({
          key,
          onSelect: () => runSelectionQuickAction(key),
          text: TABLE_SELECTION_QUICK_LABELS[key]
        })),
        type: "checkbox",
        onChange: (keys) => { selectedRowKeys.value = [...keys]; }
      };
    });

    function resetQuery() {
      queryFields.forEach((field) => { queryModel[field.key] = queryFieldDefault(field, query); });
      activeQuickRange.value = query.defaultQuickRange || "";
      appliedQuery.value = {};
      currentPage.value = 1;
      selectedRowKeys.value = [];
      expandedRowKeys.value = [];
      feedback.value = "已重置查询条件。";
    }

    function resetCreateDrawer() {
      createFields.forEach((field) => {
        if (field.control !== "static") createModel[field.key] = fieldDefault(field);
      });
      createFormRef.value?.clearValidate?.();
    }

    function openCreateDrawer() {
      resetCreateDrawer();
      createDrawerOpen.value = true;
    }

    function closeCreateDrawer() {
      createDrawerOpen.value = false;
    }

    function openDetailDrawer(record) {
      activeDetailRecord.value = record;
      detailDrawerOpen.value = true;
    }

    function closeDetailDrawer() {
      detailDrawerOpen.value = false;
      activeDetailRecord.value = null;
    }

    function updateCreateField(field, value) {
      createModel[field.key] = value;
    }

    function nextWorkflowRowKey() {
      const prefix = createDrawer?.addRow?.keyPrefix || "R";
      const existing = new Set(sourceRows.value.map((row) => String(row[table.rowKey])));
      let index = sourceRows.value.length + 1;
      let key = `${prefix}${String(index).padStart(3, "0")}`;
      while (existing.has(key)) {
        index += 1;
        key = `${prefix}${String(index).padStart(3, "0")}`;
      }
      return key;
    }

    async function saveCreateDrawer() {
      try {
        await createFormRef.value?.validate?.();
      } catch {
        return;
      }
      const mapping = createDrawer?.addRow?.fields || {};
      const record = { [table.rowKey]: nextWorkflowRowKey() };
      Object.entries(mapping).forEach(([key, value]) => {
        const mapped = value.from === undefined ? value.value : createModel[value.from];
        record[key] = Array.isArray(mapped) ? [...mapped] : mapped;
      });
      sourceRows.value = [record, ...sourceRows.value];
      currentPage.value = 1;
      closeCreateDrawer();
      feedback.value = `已新增记录 ${record[table.rowKey]}。`;
    }

    function runAction(action, record) {
      if (action?.key === detailDrawer?.trigger && record) {
        openDetailDrawer(record);
        return;
      }
      const identifier = record[table.rowKey] || "";
      feedback.value = `已触发记录 ${identifier} 的${action.label}操作。`;
    }

    function runCommand(command, label) {
      if (command === createDrawer?.trigger) {
        openCreateDrawer();
        return;
      }
      if (command === "refresh") {
        feedback.value = "列表已刷新。";
        return;
      }
      feedback.value = `已触发${label || command}入口。`;
    }

    function selectionItemLabel() {
      return selection?.itemLabel || "记录";
    }

    function rowKeyOf(record) {
      return record[table.rowKey];
    }

    function clearSelection(announce = true) {
      selectedRowKeys.value = [];
      if (announce) feedback.value = "已取消所有选择。";
    }

    function selectAllResults() {
      selectedRowKeys.value = rows.value.map((record) => rowKeyOf(record));
    }

    function selectCurrentPage() {
      selectedRowKeys.value = pageRows.value.map((record) => rowKeyOf(record));
    }

    function invertCurrentPage() {
      const next = new Set(selectedRowKeys.value);
      pageRows.value.forEach((record) => {
        const key = rowKeyOf(record);
        if (next.has(key)) next.delete(key);
        else next.add(key);
      });
      selectedRowKeys.value = [...next];
    }

    function runSelectionQuickAction(key) {
      if (key === "all-results") selectAllResults();
      else if (key === "current-page") selectCurrentPage();
      else if (key === "invert-current-page") invertCurrentPage();
      else clearSelection();
    }

    function runBatchAction(action) {
      if (!selectedCount.value) return;
      feedback.value = `已触发${action.label}，共 ${selectedCount.value} 条${selectionItemLabel()}。`;
    }

    function updateQueryField(field, value) {
      queryModel[field.key] = value;
      if (field.control === "date-range") activeQuickRange.value = "";
      currentPage.value = 1;
    }

    function applyQuery() {
      appliedQuery.value = Object.fromEntries(queryFields.map((field) => [field.key, cloneQueryValue(field, queryModel[field.key])]));
      currentPage.value = 1;
      selectedRowKeys.value = [];
      expandedRowKeys.value = [];
      feedback.value = "查询条件已应用。";
    }

    function chooseQuickRange(key) {
      if (!quickRangeField) return;
      queryModel[quickRangeField.key] = quickRangeValue(key);
      activeQuickRange.value = key;
      currentPage.value = 1;
    }

    function toggleQuery(event) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      expanded.value = !expanded.value;
    }

    function setColumnVisible(key, checked) {
      const column = (table.columns || []).find((item) => item.key === key);
      if (column?.required || key === "actions") return;
      const next = new Set(visibleColumnKeys.value);
      if (checked) next.add(key);
      else next.delete(key);
      visibleColumnKeys.value = next;
    }

    function moveColumn(sourceKey, targetKey) {
      if (!sourceKey || sourceKey === targetKey) return;
      const next = [...columnOrder.value];
      const sourceIndex = next.indexOf(sourceKey);
      const targetIndex = next.indexOf(targetKey);
      if (sourceIndex < 0 || targetIndex < 0) return;
      next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, sourceKey);
      columnOrder.value = next;
    }

    function resetColumns() {
      columnOrder.value = [...defaultColumnOrder];
      visibleColumnKeys.value = new Set((table.columns || []).filter((column) => column.hidden !== true).map((column) => column.key));
      feedback.value = "已恢复默认列设置。";
    }

    function renderQueryControl(field) {
      if (field.control === "select") {
        return h(Select, {
          allowClear: true,
          options: (field.options || []).map((option) => ({ label: option.label, value: option.value })),
          placeholder: field.placeholder || "请选择",
          value: queryModel[field.key],
          "onUpdate:value": (value) => updateQueryField(field, value)
        });
      }
      if (field.control === "date-range") {
        const hasQuickRanges = field.key === quickRangeField?.key;
        return h("div", { class: "vue-ant-date-range-control" }, [
          h(DatePicker.RangePicker, {
            allowClear: true,
            format: field.format || (field.showTime === false ? "YYYY/MM/DD" : "YYYY/MM/DD HH:mm:ss"),
            placeholder: field.placeholder || ["开始时间", "结束时间"],
            showTime: field.showTime !== false,
            value: queryModel[field.key],
            "onUpdate:value": (value) => updateQueryField(field, value)
          }),
          hasQuickRanges ? h("div", { class: "vue-ant-quick-ranges" }, query.quickRanges.map((key) => h(Button, {
            class: { "is-active": activeQuickRange.value === key },
            onClick: () => chooseQuickRange(key),
            size: "small",
            type: "text"
          }, { default: () => QUICK_RANGE_LABELS[key] }))) : null
        ]);
      }
      return h(Input, {
        allowClear: true,
        autocomplete: "off",
        placeholder: field.placeholder || `请输入${field.label}`,
        value: queryModel[field.key],
        "onUpdate:value": (value) => updateQueryField(field, value)
      });
    }

    function renderColumnSettings() {
      const settingContent = h("div", { class: "vue-ant-column-settings" }, [
        h("div", { class: "vue-ant-column-settings-header" }, [
          h("strong", "列设置"),
          h(Button, { onClick: resetColumns, size: "small", type: "link" }, { default: () => "重置" })
        ]),
        h("div", { class: "vue-ant-column-settings-list" }, (table.columns || []).map((column) => {
          const required = column.required || column.key === "actions";
          return h("div", {
            class: ["vue-ant-column-setting-item", { "is-required": required }],
            draggable: !required,
            onDragover: (event) => { if (!required) event.preventDefault(); },
            onDragstart: (event) => {
              if (required) return;
              draggedColumnKey.value = column.key;
              event.dataTransfer?.setData("text/plain", column.key);
            },
            onDrop: (event) => {
              if (required) return;
              event.preventDefault();
              moveColumn(draggedColumnKey.value, column.key);
              draggedColumnKey.value = "";
            }
          }, [
            h(HolderOutlined, { class: "vue-ant-column-drag-handle" }),
            h(Checkbox, {
              checked: visibleColumnKeys.value.has(column.key),
              disabled: required,
              "onUpdate:checked": (checked) => setColumnVisible(column.key, checked)
            }),
            h("span", column.label)
          ]);
        }))
      ]);
      return h(Popover, { placement: "bottomRight", trigger: "click" }, {
        content: () => settingContent,
        default: () => h(Tooltip, { title: "列设置" }, {
          default: () => h(Button, {
            "aria-label": "列设置",
            class: "vue-ant-icon-button",
            icon: h(SettingOutlined),
            type: "text"
          })
        })
      });
    }

    function renderStatistics() {
      const statistics = props.config.statistics || {};
      const items = statistics.items || [];
      if (!items.length) return null;
      const layout = statistics.layout || "standard";
      return h("section", { class: ["vue-ant-statistics", `is-${layout}`], "aria-label": "查询结果统计" }, [
        h("div", {
          class: "vue-ant-statistics-grid",
          style: { "--vue-ant-stat-columns": items.length }
        }, items.map((item) => h(Card, {
          bordered: false,
          class: "vue-ant-stat-card",
          size: "small"
        }, {
          default: () => [
            h("div", { class: "vue-ant-stat-card-header" }, [
              h("span", { class: "vue-ant-stat-card-label" }, statisticLabel(item)),
              item.helpText ? h(Tooltip, { title: item.helpText }, {
                default: () => h(Button, {
                  "aria-label": `${statisticLabel(item)}说明`,
                  class: "vue-ant-stat-help",
                  icon: h(InfoCircleOutlined),
                  size: "small",
                  type: "text"
                })
              }) : null
            ]),
            h("strong", { class: "vue-ant-stat-card-value" }, formatStatisticValue(item, rows.value)),
            layout === "rich" ? h("div", { class: "vue-ant-stat-card-footer" }, [
              ...(item.detailItems || []).map((detail, index) => h("span", { class: "vue-ant-stat-card-detail" }, [
                index ? h("span", { class: "vue-ant-stat-card-divider" }, "|") : null,
                detail
              ])),
              item.action ? h(Button, {
                onClick: () => runCommand(item.action.key, item.action.label),
                size: "small",
                type: "link"
              }, { default: () => item.action.label }) : null
            ]) : null
          ]
        })))
      ]);
    }

    function renderBatchAction(action) {
      const button = h(Button, {
        danger: Boolean(action.danger),
        disabled: !selectedCount.value,
        onClick: action.confirm ? undefined : () => runBatchAction(action)
      }, { default: () => action.label });
      if (!action.confirm) return button;
      return h(Popconfirm, {
        cancelText: "取消",
        okText: "确认",
        onConfirm: () => runBatchAction(action),
        title: action.confirm
      }, { default: () => button });
    }

    function rowCanExpand(record) {
      return Boolean(expandable && Array.isArray(record[expandable.childRowsKey]) && record[expandable.childRowsKey].length);
    }

    function renderExpandedChildTable({ record }) {
      const childTable = expandable?.childTable || {};
      const childRows = Array.isArray(record[expandable?.childRowsKey]) ? record[expandable.childRowsKey] : [];
      return h("div", { class: "vue-ant-child-table" }, [
        h(Table, {
          columns: makeChildTableColumns(childTable.columns || []),
          dataSource: childRows,
          pagination: false,
          rowKey: childTable.rowKey || "id",
          size: "small"
        })
      ]);
    }

    return () => {
      const pagination = table.pagination || {};
      const queryActions = h("div", { class: "vue-ant-query-actions", key: "query-actions" }, [
        canToggleQuery.value ? h(Button, {
          "aria-expanded": expanded.value,
          htmlType: "button",
          key: "query-toggle",
          onClick: toggleQuery,
          type: "link"
        }, { default: () => expanded.value ? "收起" : "展开" }) : null,
        h(Button, { htmlType: "button", key: "query-reset", onClick: resetQuery }, { default: () => "重置" }),
        h(Button, { htmlType: "button", key: "query-submit", onClick: applyQuery, type: "primary" }, {
          default: () => [h(SearchOutlined), "查询"]
        })
      ]);
      const querySection = h("section", { class: "vue-ant-query-panel" }, [
        h(Form, { class: "vue-ant-query-grid", model: queryModel }, {
          default: () => [...visibleFields.value.map((field) => h("div", {
            class: [
              "vue-ant-query-field",
              `is-span-${field.span || 1}`,
              {
                "is-date-range": field.control === "date-range",
                "has-quick-ranges": field.key === quickRangeField?.key
              }
            ],
            key: field.key
          }, [
            h("span", { class: "vue-ant-query-label" }, `${field.label}：`),
            h("div", { class: "vue-ant-query-control" }, [renderQueryControl(field)])
          ])), queryActions]
        })
      ]);

      const tools = (table.tools || []).map((tool) => {
        if (tool === "settings") return renderColumnSettings();
        const meta = listToolMeta(tool);
        return h(Tooltip, { title: meta.label }, {
          default: () => h(Button, {
            "aria-label": meta.label,
            class: "vue-ant-icon-button",
            icon: h(meta.icon),
            onClick: () => runCommand(tool, meta.label),
            type: "text"
          })
        });
      });

      const statistics = renderStatistics();
      const summaryParts = summaryText(table, rows.value);
      const list = h("section", { class: "vue-ant-list-panel" }, [
        h("div", { class: "vue-ant-list-toolbar" }, [
          h("div", { class: "vue-ant-list-toolbar-leading" }, [
            table.sectionTitle ? h("h2", { class: "vue-ant-list-section-title" }, table.sectionTitle) : null,
            summaryParts.length ? h("div", { class: "vue-ant-list-summary" }, summaryParts.map((part, index) => h("span", { class: "vue-ant-summary-part" }, [
              index ? h("span", { class: "vue-ant-summary-divider" }, "|") : null,
              part
            ]))) : null
          ]),
          h("div", { class: "vue-ant-list-tools" }, [
            ...(table.batchActions || []).map((action) => renderBatchAction(action)),
            ...(table.secondaryActions || []).map((action) => h(Button, { onClick: () => runCommand(action.key, action.label) }, { default: () => action.label })),
            table.primaryAction ? h(Button, { onClick: () => runCommand(table.primaryAction.key, table.primaryAction.label), type: "primary" }, { default: () => table.primaryAction.label }) : null,
            ...tools
          ])
        ]),
        selection && selectedCount.value ? h("div", { class: "vue-ant-selection-bar", role: "status", "aria-live": "polite" }, [
          h("span", { class: "vue-ant-selection-count" }, `已选择 ${selectedCount.value} 条${selectionItemLabel()}`),
          h(Button, { onClick: () => clearSelection(), type: "link" }, { default: () => "取消选择" })
        ]) : null,
        h(Table, {
          columns: displayColumns.value,
          dataSource: pageRows.value,
          ...(expandable ? {
            expandedRowKeys: expandedRowKeys.value,
            expandedRowRender: renderExpandedChildTable,
            onExpandedRowsChange: (keys) => { expandedRowKeys.value = [...keys]; },
            rowExpandable: rowCanExpand
          } : {}),
          pagination: false,
          rowKey: table.rowKey || "id",
          rowSelection: rowSelection.value,
          scroll: displayColumns.value.some((column) => column.fixed) || displayColumns.value.length > 6
            ? { x: table.scrollX || "max-content" }
            : undefined,
          size: "middle"
        }),
        h("div", { class: "vue-ant-pagination" }, [
          h("span", { class: "vue-ant-pagination-summary" }, `共 ${rows.value.length} 条记录，当前第 ${currentPage.value} / ${pageCount.value} 页`),
          h(Pagination, {
            current: currentPage.value,
            onChange: (page, nextPageSize) => {
              currentPage.value = page;
              if (nextPageSize) pageSize.value = nextPageSize;
            },
            onShowSizeChange: (_page, nextPageSize) => {
              pageSize.value = nextPageSize;
              currentPage.value = 1;
            },
            pageSize: pageSize.value,
            pageSizeOptions: pagination.pageSizeOptions || ["20", "50", "100"],
            showSizeChanger: pagination.allowPageSizeChange !== false,
            total: rows.value.length
          })
        ]),
        feedback.value ? h("p", { class: "vue-ant-feedback", "aria-live": "polite" }, feedback.value) : null
      ]);

      const createDrawerNode = createDrawer ? h(Drawer, {
        class: "vue-ant-workflow-drawer vue-ant-create-drawer",
        destroyOnClose: false,
        onClose: closeCreateDrawer,
        open: createDrawerOpen.value,
        placement: "right",
        title: createDrawer.title,
        width: createDrawer.width || 520
      }, {
        default: () => h(Form, {
          class: "vue-ant-workflow-form",
          colon: false,
          layout: "vertical",
          model: createModel,
          ref: createFormRef
        }, {
          default: () => createFields.map((field) => h(FormItem, {
            key: field.key,
            label: field.label,
            name: field.key,
            required: field.required,
            rules: buildFormRules(field)
          }, {
            default: () => [
              renderFormControl(field, createModel, updateCreateField, () => {}),
              field.helperText ? h("p", { class: "ant-form-item-extra" }, field.helperText) : null
            ]
          }))
        }),
        footer: () => h("div", { class: "vue-ant-workflow-drawer-actions" }, [
          h(Button, { onClick: closeCreateDrawer }, { default: () => createDrawer.form.cancelLabel || "取消" }),
          h(Button, { onClick: saveCreateDrawer, type: "primary" }, { default: () => createDrawer.form.primaryLabel || "保存" })
        ])
      }) : null;

      const detailDrawerNode = detailDrawer ? h(Drawer, {
        class: "vue-ant-workflow-drawer vue-ant-workflow-detail-drawer",
        onClose: closeDetailDrawer,
        open: detailDrawerOpen.value,
        placement: "right",
        title: detailDrawer.title,
        width: detailDrawer.width || 640
      }, {
        default: () => h("div", { class: "vue-ant-workflow-detail-content" }, (detailDrawer.groups || []).map((group) => h("section", {
          class: "vue-ant-detail-group",
          key: group.key
        }, [
          h("div", { class: "vue-ant-detail-group-header" }, [h("h2", { class: "vue-ant-detail-group-title" }, group.title)]),
          h(Descriptions, { class: "vue-ant-detail-descriptions", column: 2, size: "small" }, {
            default: () => (group.fields || []).map((field) => h(DescriptionsItem, {
              key: field.key,
              label: field.label,
              span: field.span === "full" ? 2 : field.span || 1
            }, { default: () => renderDetailDisplay(activeDetailRecord.value?.[field.sourceKey], field) }))
          })
        ]))),
        footer: () => h("div", { class: "vue-ant-workflow-drawer-actions" }, [
          h(Button, { onClick: closeDetailDrawer, type: "primary" }, { default: () => detailDrawer.closeLabel || "关闭" })
        ])
      }) : null;

      return h("div", { class: "vue-ant-page vue-ant-list-page" }, [querySection, statistics, list, createDrawerNode, detailDrawerNode]);
    };
  }
});

function formatDetailDisplay(value, descriptor = {}) {
  if (value === undefined || value === null || value === "") return "-";
  if (descriptor.format === "datetime") {
    const date = dayjs(value);
    return date.isValid() ? date.format(descriptor.dateFormat || "YYYY-MM-DD HH:mm:ss") : String(value);
  }
  if (descriptor.format === "amount") {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);
    const precision = Number.isInteger(descriptor.precision) ? descriptor.precision : 2;
    const formatted = new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(Math.abs(amount));
    const sign = amount < 0 ? "-" : "";
    const prefix = descriptor.currency === "CNY" && descriptor.currencyDisplay === "prefix" ? "¥" : "";
    return `${sign}${prefix}${formatted}`;
  }
  return String(value);
}

function detailStatus(value, statusMap = {}, fallbackTone = "default") {
  const mapped = statusMap?.[value];
  if (mapped && typeof mapped === "object") return { label: mapped.label || String(value), tone: mapped.tone || fallbackTone };
  if (typeof mapped === "string") return { label: mapped, tone: fallbackTone };
  return { label: String(value), tone: fallbackTone };
}

function renderDetailDisplay(value, descriptor = {}) {
  if (descriptor.format === "status") {
    const status = detailStatus(value, descriptor.statusMap, descriptor.tone);
    return h(Badge, { status: status.tone, text: status.label });
  }
  const text = formatDetailDisplay(value, descriptor);
  return h("span", { class: descriptor.ellipsis ? "vue-ant-ellipsis" : undefined }, text);
}

function makeDetailTableColumns(columns) {
  return columns.map((column) => ({
    align: column.align || (column.format === "amount" ? "right" : undefined),
    dataIndex: column.key,
    ellipsis: Boolean(column.ellipsis),
    key: column.key,
    title: column.label,
    width: column.width,
    customRender: ({ text }) => renderDetailDisplay(text, column)
  }));
}

const DetailPage = defineComponent({
  name: "AdminPcAntDetailPage",
  props: { config: { type: Object, required: true } },
  setup(props) {
    const detail = props.config.detail || {};
    const groups = detail.groups || [];
    const presentation = props.config.page?.presentation || "page";
    const activeTab = ref(groups[0]?.key || "");
    const open = ref(true);
    const feedback = ref("");
    const usesTabs = props.config.content?.capabilities?.includes("detail.sectionTabs");
    const usesAnchors = props.config.content?.capabilities?.includes("detail.anchors");

    const closeOverlay = () => {
      open.value = false;
    };

    const runAction = (action) => {
      if (!action) return;
      if (["drawer", "modal"].includes(presentation) && action.key === "close") {
        closeOverlay();
        return;
      }
      feedback.value = `已触发${action.label}操作。`;
    };

    const renderActionButtons = (includeClose = false) => {
      const actions = detail.actions || {};
      const secondary = (actions.secondary || []).map((action) => h(Button, {
        onClick: () => runAction(action)
      }, { default: () => action.label }));
      const primary = actions.primary ? h(Button, {
        danger: Boolean(actions.primary.danger),
        onClick: () => runAction(actions.primary),
        type: "primary"
      }, { default: () => actions.primary.label }) : null;
      const hasCloseAction = [actions.primary, ...(actions.secondary || [])].some((action) => action?.key === "close");
      const close = includeClose && !hasCloseAction ? h(Button, { onClick: closeOverlay }, { default: () => "关闭" }) : null;
      return [...secondary, primary, close].filter(Boolean);
    };

    const renderGroup = (group, { flat = false, hideHeader = false } = {}) => {
      const fields = group.fields || [];
      // Details are always rendered with Ant Design Vue's native descriptions primitives.
      const descriptionItems = fields.map((field) => h(DescriptionsItem, {
        key: field.key,
        label: field.label,
        span: field.span === "full" ? 3 : field.span || 1
      }, { default: () => renderDetailDisplay(field.value, field) }));
      const groupContent = [
        hideHeader ? null : h("div", { class: "vue-ant-detail-group-header" }, [
          h("h2", { class: "vue-ant-detail-group-title" }, group.title),
          group.description ? h("p", { class: "vue-ant-detail-group-description" }, group.description) : null
        ]),
        fields.length ? h(Descriptions, {
          class: "vue-ant-detail-descriptions",
          column: 3,
          size: "small"
        }, { default: () => descriptionItems }) : null,
        group.table ? h("div", { class: "vue-ant-detail-table" }, [
          h(Table, {
            columns: makeDetailTableColumns(group.table.columns || []),
            dataSource: group.table.rows || [],
            pagination: false,
            rowKey: group.table.rowKey || "id",
            scroll: (group.table.columns || []).length > 6 ? { x: "max-content" } : undefined,
            size: "middle"
          })
        ]) : null
      ];

      if (flat) {
        return h("section", { class: "vue-ant-detail-group vue-ant-detail-quick-group", id: `detail-${group.key}` }, groupContent);
      }

      return h("section", { class: "vue-ant-detail-group", id: `detail-${group.key}` }, groupContent);
    };

    const renderMetrics = () => {
      const metrics = detail.metrics || [];
      if (!metrics.length) return null;
      return h("section", { class: "vue-ant-detail-metrics", "aria-label": "详情摘要" }, metrics.map((item) => h("div", {
        class: "vue-ant-detail-metric",
        key: item.key
      }, [
        h("span", { class: "vue-ant-detail-metric-label" }, item.label),
        h("strong", { class: "vue-ant-detail-metric-value" }, String(item.value)),
        item.description ? h("span", { class: "vue-ant-detail-metric-description" }, item.description) : null
      ])));
    };

    const renderGroupsContent = () => {
      if (usesTabs) {
        return h(Tabs, {
          activeKey: activeTab.value,
          class: "vue-ant-detail-tabs",
          destroyInactiveTabPane: true,
          "onUpdate:activeKey": (key) => { activeTab.value = key; }
        }, {
          default: () => groups.map((group) => h(Tabs.TabPane, { key: group.key, tab: group.title }, {
            default: () => renderGroup(group, { hideHeader: true })
          }))
        });
      }

      if (usesAnchors) {
        return h("div", { class: "vue-ant-detail-anchor-layout" }, [
          h("aside", { class: "vue-ant-detail-anchor-nav", "aria-label": "详情导航" }, [
            h(Anchor, {
              affix: true,
              items: groups.map((group) => ({ href: `#detail-${group.key}`, key: group.key, title: group.title }))
            })
          ]),
          h("div", { class: "vue-ant-detail-groups" }, groups.map((group) => renderGroup(group)))
        ]);
      }

      if (presentation === "modal") {
        return h("div", { class: "vue-ant-detail-groups vue-ant-detail-quick-groups" }, [
          renderGroup(groups[0], { flat: true, hideHeader: true })
        ]);
      }

      return h("div", { class: "vue-ant-detail-groups" }, groups.map((group) => renderGroup(group)));
    };

    const renderPageDetail = () => h("div", { class: "vue-ant-page vue-ant-detail-page" }, [
      renderMetrics(),
      renderGroupsContent(),
      detail.actions ? h("div", { class: "vue-ant-detail-page-actions" }, renderActionButtons()) : null,
      feedback.value ? h("p", { class: "vue-ant-feedback", "aria-live": "polite" }, feedback.value) : null
    ]);

    return () => {
      if (presentation === "page") return renderPageDetail();
      if (!open.value) {
        return h("div", { class: "vue-ant-detail-reopen" }, [
          h(Button, { onClick: () => { open.value = true; }, type: "primary" }, { default: () => "重新打开详情" })
        ]);
      }
      if (presentation === "drawer") {
        return h(Drawer, {
          closable: true,
          onClose: closeOverlay,
          open: open.value,
          placement: "right",
          title: detail.title,
          width: 960
        }, {
          default: () => h("div", { class: "vue-ant-detail-drawer-content" }, [
            renderGroupsContent(),
            feedback.value ? h("p", { class: "vue-ant-feedback", "aria-live": "polite" }, feedback.value) : null
          ]),
          footer: () => h("div", { class: "vue-ant-detail-drawer-actions" }, renderActionButtons(true))
        });
      }
      return h(Modal, {
        centered: true,
        onCancel: closeOverlay,
        open: open.value,
        title: detail.title,
        width: 860
      }, {
        default: () => [renderGroupsContent(), feedback.value ? h("p", { class: "vue-ant-feedback", "aria-live": "polite" }, feedback.value) : null],
        footer: () => renderActionButtons(true)
      });
    };
  }
});

const FEEDBACK_ICONS = [FrownOutlined, FrownOutlined, MehOutlined, SmileOutlined, LikeOutlined];

const ResultPage = defineComponent({
  name: "AdminPcAntResultPage",
  props: { config: { type: Object, required: true } },
  setup(props) {
    const result = props.config.result || {};
    const feedbackChoice = ref("");
    const actionFeedback = ref("");

    const runAction = (action) => {
      if (!action) return;
      actionFeedback.value = `已触发${action.label}操作。`;
    };

    const resultStatus = computed(() => result.status === "processing" ? "info" : result.status || "success");

    return () => {
      const actions = result.actions || {};
      const primaryAction = normalizeResultAction(actions.primary, "primary-result-action");
      const secondaryActions = (actions.secondary || [])
        .map((action, index) => normalizeResultAction(action, `secondary-result-action-${index}`))
        .filter(Boolean);
      const feedback = result.feedback;
      return h("div", { class: "vue-ant-page vue-ant-result-page" }, [
        h(Result, {
          status: resultStatus.value,
          subTitle: result.description,
          title: result.title
        }),
        result.summary?.items?.length ? h("section", { class: "vue-ant-result-summary", "aria-label": "处理结果摘要" }, result.summary.items.map((item) => h("div", {
          class: "vue-ant-result-summary-item",
          key: item.key
        }, [
          h("span", item.label),
          h("strong", String(item.value))
        ]))) : null,
        h("div", { class: "vue-ant-result-actions" }, [
          primaryAction ? h(Button, { onClick: () => runAction(primaryAction), type: "primary" }, { default: () => primaryAction.label }) : null,
          ...secondaryActions.map((action) => h(Button, { onClick: () => runAction(action) }, { default: () => action.label }))
        ].filter(Boolean)),
        feedback ? h("section", { class: "vue-ant-result-feedback", "aria-label": feedback.prompt }, [
          h("p", { class: "vue-ant-result-feedback-prompt" }, feedback.prompt),
          h("div", { class: "vue-ant-result-feedback-options" }, feedback.options.map((option, index) => {
            const Icon = FEEDBACK_ICONS[index % FEEDBACK_ICONS.length];
            return h(Button, {
              class: ["vue-ant-result-feedback-option", { "is-selected": feedbackChoice.value === option.key }],
              onClick: () => { feedbackChoice.value = option.key; },
              type: "text"
            }, {
              default: () => [h(Icon), h("span", option.label)]
            });
          }))
        ]) : null,
        actionFeedback.value ? h("p", { class: "vue-ant-result-action-feedback", "aria-live": "polite" }, actionFeedback.value) : null
      ]);
    };
  }
});

const PageRoot = defineComponent({
  name: "AdminPcAntPageRoot",
  props: { config: { type: Object, required: true } },
  setup(props) {
    return () => h(ConfigProvider, { theme: ANT_THEME }, {
      default: () => {
        const family = props.config.page?.family;
        if (family === "list") return h(ListPage, { config: props.config });
        if (family === "detail") return h(DetailPage, { config: props.config });
        if (family === "result") return h(ResultPage, { config: props.config });
        return h(FormPage, { config: props.config });
      }
    });
  }
});

function readConfig(root) {
  const declaration = root.querySelector("script[data-admin-pc-vue-page]");
  if (!declaration) return null;
  try {
    return JSON.parse(declaration.textContent || "{}");
  } catch (error) {
    console.error("Unable to parse Vue/Ant page declaration.", error);
    return null;
  }
}

function contentSurfaceFor(config) {
  const blockCount = config.page?.family === "list"
    ? 2 + ((config.statistics?.items || []).length ? 1 : 0)
    : config.page?.family === "detail"
      ? Math.max(1, config.detail?.groups?.length || 0)
      : Math.max(1, config.form?.groups?.length || 0);
  return blockCount > 1 ? "grouped" : "single";
}

export function mountVueAntPage(root = document.getElementById("page-content")) {
  if (!root || root.dataset.runtimeMounted === "true") return null;
  const config = readConfig(root);
  if (!config || config.runtime !== "vue-ant" || !["form", "list", "detail", "result"].includes(config.page?.family)) return null;

  const mountPoint = document.createElement("div");
  mountPoint.dataset.adminPcVueRoot = "";
  root.replaceChildren(mountPoint);
  root.dataset.pageFamily = config.page.family;
  root.dataset.pagePresentation = config.page.presentation || "page";
  root.dataset.contentSurface = contentSurfaceFor(config);
  root.dataset.runtimeMounted = "true";
  const app = createApp(PageRoot, { config });
  app.mount(mountPoint);
  return app;
}

export function mountAllVueAntPages() {
  return [...document.querySelectorAll("#page-content")].map((root) => mountVueAntPage(root)).filter(Boolean);
}

window.AdminPcVueAnt = { mountAllVueAntPages, mountVueAntPage };

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAllVueAntPages, { once: true });
} else {
  mountAllVueAntPages();
}
