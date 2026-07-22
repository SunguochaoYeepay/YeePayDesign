import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readYamlPageSpec, validateVueAntPageSpec } from "../tools/lib/vue-ant-page-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const promptFile = path.join(root, "prompts", "acceptance-baseline.md");
const scenarios = [
  ["普通信息收集", "form-single-stage"],
  ["普通表单加右侧说明", "form-single-stage-illustration"],
  ["分组配置表单", "form-complex-groups"],
  ["分阶段账户变更", "change-settler"],
  ["上传、复核和完成", "form-upload-flow"],
  ["列表加简单操作", "list-simple-operations"],
  ["高级查询、工具栏和列设置", "list-complex-operations"],
  ["列表统计", "list-statistics-standard"],
  ["批量操作", "list-batch-operations"],
  ["父表展开子表", "list-expand-child-table"],
  ["列表内新增与详情抽屉", "list-drawer-workflow"],
  ["快速详情弹窗", "detail-quick-modal"],
  ["详情抽屉和退款明细", "detail-drawer-record"],
  ["长详情页和锚点定位", "detail-anchors"],
  ["分组标签详情和指标", "detail-tabs-metrics"]
];

const prompts = fs.readFileSync(promptFile, "utf8");
assert.equal(scenarios.length, 15, "Demo suite must contain the promised 15 scenarios.");

for (const [title, fixture] of scenarios) {
  assert(prompts.includes(title), `Demo prompt is missing: ${title}.`);
  const directory = path.join(root, "qa", "vue-ant-poc", fixture);
  const specFile = path.join(directory, "page-spec.yaml");
  const spec = readYamlPageSpec(specFile);
  assert.deepEqual(validateVueAntPageSpec(spec), [], `${title} fixture must satisfy the Page Spec contract.`);

  const result = spawnSync(process.execPath, [
    "tools/build-vue-ant-page.mjs",
    path.relative(root, specFile),
    path.relative(root, path.join(directory, "page-content.html")),
    path.relative(root, path.join(directory, "checklist.md")),
    path.relative(root, path.join(directory, "preview.html"))
  ], { cwd: root, encoding: "utf8" });

  assert.equal(result.status, 0, `${title} build failed:\n${result.stdout}\n${result.stderr}`);
  ["page-content.html", "checklist.md", "preview.html"].forEach((file) => {
    assert(fs.existsSync(path.join(directory, file)), `${title} must generate ${file}.`);
  });
}

console.log(`Demo prompt regression passed for ${scenarios.length} scenarios.`);
