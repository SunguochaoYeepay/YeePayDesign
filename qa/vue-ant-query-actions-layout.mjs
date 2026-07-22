import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.css"), "utf8");
const listRules = fs.readFileSync(path.join(root, "specs", "list-pattern-rules.md"), "utf8");
const listPack = fs.readFileSync(path.join(root, "context-packs", "admin-pc-ant-list.md"), "utf8");
const complexListSpec = fs.readFileSync(path.join(root, "qa", "vue-ant-poc", "list-complex-operations", "page-spec.yaml"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const formStart = runtime.indexOf('h(Form, { class: "vue-ant-query-grid", model: queryModel }');
const formEnd = runtime.indexOf("const tools =", formStart);
const formSlot = runtime.slice(formStart, formEnd);

assert(formStart >= 0, "Query Form grid is missing.");
assert(formSlot.includes("queryActions]"), "Query actions must be a child of the query grid.");
assert(!formSlot.includes("}),\n        h(\"div\", { class: \"vue-ant-query-actions\" }"), "Query actions must not be rendered outside the query grid.");
assert(/\.vue-ant-query-grid\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/s.test(styles), "Query fields must retain source order in a wrapping layout.");
assert(/\.vue-ant-query-actions\s*\{[^}]*flex:\s*0\s+0\s+var\(--vue-ant-query-cell\);[^}]*margin-inline-start:\s*auto;/s.test(styles), "Query actions must fill the final cell and align to the row end.");
assert(styles.includes(".vue-ant-query-field.is-span-2"), "Wide query fields must retain their two-column layout.");
assert(styles.includes(".vue-ant-query-field.is-span-3"), "Wide query fields must retain their full-row layout.");
assert(runtime.includes("const quickRangeField = query.quickRanges?.length"), "Quick ranges must resolve one owning date-range field.");
assert(runtime.includes('"has-quick-ranges": field.key === quickRangeField?.key'), "Quick range fields must be marked for the dedicated layout.");
assert(runtime.includes("function toggleQuery(event)"), "Collapsible queries must use a stable toggle handler.");
assert(runtime.includes("expanded.value = !expanded.value;"), "The query toggle must support both collapse and expand transitions.");
assert(runtime.includes('"aria-expanded": expanded.value'), "The query toggle must expose its current expand state.");
assert(runtime.includes("onClick: toggleQuery"), "The query toggle must retain its handler after a re-render.");
assert(runtime.includes('key: "query-actions"'), "The query action group must keep a stable key while fields collapse.");
assert(runtime.includes("key: field.key"), "Every query field must keep a stable key while fields collapse.");
assert(/\.vue-ant-query-field\.has-quick-ranges\s*\{[^}]*flex-basis:\s*100%;/s.test(styles), "Quick range fields must occupy a dedicated query row.");
assert(/\.vue-ant-query-field\.has-quick-ranges \.vue-ant-date-range-control\s*\{[^}]*gap:\s*16px;/s.test(styles), "Quick date options must align horizontally with the date range.");
assert(/\.vue-ant-quick-ranges \.ant-btn\s*\{[^}]*height:\s*40px;/s.test(styles), "Quick date controls must use the standard query control height.");
assert(listRules.includes("查询操作布局"), "List pattern rules must document query action placement.");
assert(listPack.includes("最后一行最右列"), "List Context Pack must document query action placement.");
assert(listRules.includes("快捷日期布局"), "List pattern rules must document quick date placement.");
assert(listPack.includes("该时间条件组独占一行"), "List Context Pack must document the dedicated quick date row.");
assert(complexListSpec.indexOf("key: createdAt") < complexListSpec.indexOf("key: ruleName"), "The complex-list fixture must lead with its quick date group.");

function actionPosition(spans, columns) {
  let row = 1;
  let used = 0;

  spans.forEach((span) => {
    const occupied = Math.min(span, columns);
    if (used + occupied > columns) {
      row += 1;
      used = 0;
    }
    used += occupied;
  });

  if (used === columns) row += 1;
  return { row, column: columns };
}

[
  { spans: [1], columns: 3, expected: { row: 1, column: 3 } },
  { spans: [1, 1], columns: 3, expected: { row: 1, column: 3 } },
  { spans: [1, 1, 1], columns: 3, expected: { row: 2, column: 3 } },
  { spans: [1, 1, 1, 1], columns: 3, expected: { row: 2, column: 3 } },
  { spans: [1, 1, 1, 1, 1], columns: 3, expected: { row: 2, column: 3 } },
  { spans: [1, 1, 1, 1, 1, 1], columns: 3, expected: { row: 3, column: 3 } },
  { spans: [2, 1], columns: 3, expected: { row: 2, column: 3 } },
  { spans: [1, 2], columns: 3, expected: { row: 2, column: 3 } },
  { spans: [1], columns: 2, expected: { row: 1, column: 2 } },
  { spans: [1, 1], columns: 2, expected: { row: 2, column: 2 } },
  { spans: [1], columns: 1, expected: { row: 2, column: 1 } }
].forEach(({ spans, columns, expected }) => {
  const actual = actionPosition(spans, columns);
  assert(actual.row === expected.row && actual.column === expected.column, `Unexpected action position for ${spans.join(",")} in ${columns} columns.`);
});

console.log("Vue/Ant query action layout checks passed.");
