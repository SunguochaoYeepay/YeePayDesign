import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import {
  resolveFormTemplate,
  validateVueAntPageSpec
} from "../tools/lib/vue-ant-page-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), "utf8");

const formRules = read("specs", "form-pattern-rules.md");
const formPack = read("context-packs", "admin-pc-ant-form.md");
const catalog = read("specs", "content-pattern-catalog.md");
const readme = read("README.md");
const fixtures = [
  {
    file: ["qa", "vue-ant-poc", "form-single-stage", "page-spec.yaml"],
    id: "form.single-stage",
    name: "单阶段信息收集表单"
  },
  {
    file: ["qa", "vue-ant-poc", "form-complex-groups", "page-spec.yaml"],
    id: "form.grouped-configuration",
    name: "分组配置表单"
  },
  {
    file: ["qa", "vue-ant-poc", "change-settler", "page-spec.yaml"],
    id: "form.staged-configuration",
    name: "分阶段配置表单"
  },
  {
    file: ["qa", "vue-ant-poc", "form-upload-flow", "page-spec.yaml"],
    id: "form.import-review-flow",
    name: "导入复核流程表单"
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const fixture of fixtures) {
  assert(formRules.includes(fixture.id), `Form pattern rules must document ${fixture.id}.`);
  assert(formPack.includes(fixture.id), `Form Context Pack must document ${fixture.id}.`);
  assert(catalog.includes(fixture.id), `Pattern catalog must document ${fixture.id}.`);
  assert(readme.includes(`[${fixture.name}]`), `README must expose ${fixture.name} as a verification template.`);

  const spec = YAML.parse(read(...fixture.file));
  const resolved = resolveFormTemplate(spec);
  assert(resolved?.id === fixture.id, `${fixture.id} fixture must resolve to its declared template.`);
  assert(!validateVueAntPageSpec(spec).length, `${fixture.id} fixture must satisfy the Page Spec contract.`);
  assert(!validateVueAntPageSpec(spec, { requireExplicitFormTemplate: true }).length, `${fixture.id} fixture must explicitly declare template.id.`);
}

const stagedSpec = YAML.parse(read("qa", "vue-ant-poc", "change-settler", "page-spec.yaml"));
stagedSpec.template.id = "form.grouped-configuration";
assert(
  validateVueAntPageSpec(stagedSpec).some((error) => error.includes("form.grouped-configuration cannot use form.steps")),
  "The contract must reject a template ID that conflicts with the declared form structure."
);

const missingTemplateSpec = YAML.parse(read("qa", "vue-ant-poc", "form-single-stage", "page-spec.yaml"));
delete missingTemplateSpec.template;
assert(
  !validateVueAntPageSpec(missingTemplateSpec).length,
  "A legacy Vue/Ant v2 form without template.id must remain buildable through structural inference."
);
assert(
  validateVueAntPageSpec(missingTemplateSpec, { requireExplicitFormTemplate: true }).some((error) => error.includes("require template.id")),
  "The current write workflow must reject a form Page Spec without template.id."
);

const simpleWithIllustration = YAML.parse(read("qa", "vue-ant-poc", "form-single-stage", "page-spec.yaml"));
simpleWithIllustration.content.capabilities.push("form.sideIllustration");
simpleWithIllustration.illustration = {
  assetStatus: "placeholder",
  copy: { title: "结算服务说明", description: "请核对资金相关信息后再提交。" }
};
assert(
  !validateVueAntPageSpec(simpleWithIllustration, { requireExplicitFormTemplate: true }).length,
  "A single-stage form must support a right-side illustration when its fields remain simple."
);

assert(!formRules.includes("普通表单"), "Subjective template labels must not remain in form rules.");
assert(!formRules.includes("超复杂表单"), "Subjective template labels must not remain in form rules.");

console.log("Vue/Ant form template classification checks passed.");
