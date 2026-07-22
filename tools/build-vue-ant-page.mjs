import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import contract from "./lib/vue-ant-page-contract.bundle.cjs";

const {
  readYamlPageSpec,
  resolveFormTemplate,
  toVueAntPageDeclaration,
  validateVueAntPageSpec,
  writeVueAntPageContent
} = contract;

const [specFile, contentFile, checklistFile, previewFile] = process.argv.slice(2);
const requiredArgs = [specFile, contentFile, checklistFile, previewFile];

if (requiredArgs.some((value) => !value)) {
  console.error("Usage: node tools/build-vue-ant-page.mjs <page-spec.yaml> <page-content.html> <checklist.md> <preview.html>");
  process.exit(1);
}

if (requiredArgs.some((value) => path.isAbsolute(value))) {
  console.error("All Vue/Ant build paths must be relative to the current project root.");
  process.exit(1);
}

function runTool(tool, args) {
  const result = spawnSync(process.execPath, [tool, ...args], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${tool} failed with exit code ${result.status}.`);
}

function writeChecklist(file, spec) {
  const fields = spec.page.family === "form"
    ? [
      ...(spec.form?.fields || []),
      ...(spec.form?.groups || []).flatMap((group) => group.fields || []),
      ...(spec.form?.modeTabs?.items || []).flatMap((item) => item.fields || [])
    ]
    : spec.query?.fields || [];
  const rows = spec.page.family === "list" ? spec.table?.rows || [] : [];
  const assumptions = spec.assumptions || [];
  const template = spec.page?.family === "form" ? resolveFormTemplate(spec) : null;
  const completionSummary = spec.page?.family === "list"
    ? `已声明 ${fields.length} 个查询字段、${rows.length} 条原型行数据。`
    : spec.page?.family === "form"
      ? `已声明 ${fields.length} 个表单字段和提交状态转场。`
      : spec.page?.family === "detail"
        ? `已声明 ${(spec.detail?.groups || []).length} 个详情信息组${(spec.detail?.groups || []).some((group) => group.table) ? "和关联明细表" : ""}。`
        : `已声明 ${spec.result?.status || "未命名"} 结果状态、后续操作与${spec.result?.summary ? "结构化摘要" : "基础反馈"}。`;
  const lines = [
    `# ${spec.page?.name || "未命名页面"} 交付检查清单`,
    "",
    `- [x] Page Spec 使用 \`admin-pc-ant\` / \`vue-ant\` / renderer v2。`,
    ...(template ? [`- [x] 表单模板为 \`${template.id}\`（${template.label}）。`] : []),
    `- [x] 页面族为 \`${spec.page?.family}\`，能力组合：${(spec.content?.capabilities || []).map((item) => `\`${item}\``).join("、") || "无"}。`,
    `- [x] 固定渲染器从 Page Spec 生成 \`#page-content\`，未写入页面级脚本或样式。`,
    `- [x] 已通过 Vue/Ant Page Spec 契约与内容静态校验。`,
    `- [x] 已由固定 Shell 成功构建 \`preview.html\`。`,
    `- [x] ${completionSummary}`
  ];

  if (assumptions.length) {
    lines.push("", "## 假设");
    assumptions.forEach((item) => lines.push(`- ${item}`));
  }

  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(path.resolve(file), `${lines.join("\n")}\n`);
}

try {
  const spec = readYamlPageSpec(path.resolve(specFile));
  const errors = validateVueAntPageSpec(spec);
  if (errors.length) throw new Error(errors.join("\n"));

  writeVueAntPageContent(path.resolve(contentFile), toVueAntPageDeclaration(spec));
  runTool("tools/check-admin-pc-content.mjs", [contentFile, specFile]);
  runTool("tools/build-preview.mjs", [contentFile, previewFile]);
  writeChecklist(checklistFile, spec);
  console.log(`Vue/Ant delivery built: ${contentFile}, ${checklistFile}, ${previewFile}`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
