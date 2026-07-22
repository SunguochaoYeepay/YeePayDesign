import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readYamlPageSpec,
  validateVueAntPageSpec
} from "../tools/lib/vue-ant-page-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(root, "qa", "vue-ant-poc", "change-settler", "page-spec.yaml");
const runtime = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.js"), "utf8");
const formPack = fs.readFileSync(path.join(root, "context-packs", "admin-pc-ant-form.md"), "utf8");
const spec = readYamlPageSpec(fixturePath);

assert.deepEqual(validateVueAntPageSpec(spec), [], "The staged form fixture must satisfy the contract.");
assert.equal(spec.form.steps[0].fieldKeys.length > 0, true, "An editable staged step must declare its fields.");
assert.equal(spec.form.confirmation.step, "confirm", "The final stage must render the declared confirmation step.");
assert.equal(spec.form.submit.result.status, "success", "A staged form must declare its success result state.");

const incompleteSpec = structuredClone(spec);
delete incompleteSpec.form.steps[0].fieldKeys;
assert.ok(
  validateVueAntPageSpec(incompleteSpec).some((error) => error.includes("fieldKeys must be a non-empty array")),
  "A staged form without field ownership must be rejected."
);

const obsoleteSpec = structuredClone(spec);
obsoleteSpec.form.stepValidation = { rule: { requiredFields: ["accountName"] } };
assert.ok(
  validateVueAntPageSpec(obsoleteSpec).some((error) => error.includes("form.stepValidation is not supported")),
  "Legacy stepValidation must not silently pass without renderer behavior."
);

const invalidConfirmationSpec = structuredClone(spec);
invalidConfirmationSpec.form.steps[2].fieldKeys = ["accountName"];
assert.ok(
  validateVueAntPageSpec(invalidConfirmationSpec).some((error) => error.includes("fieldKeys is not allowed for the confirmation step")),
  "The confirmation step must not silently accept ignored field keys."
);

const ambiguousActionSpec = structuredClone(spec);
ambiguousActionSpec.form.actions.primaryLabel = "下一步";
assert.ok(
  validateVueAntPageSpec(ambiguousActionSpec).some((error) => error.includes("name the final confirmation action")),
  "A staged form must name its final action instead of using the intermediate next-step label."
);

const missingResultSpec = structuredClone(spec);
delete missingResultSpec.form.submit.result;
assert.ok(
  validateVueAntPageSpec(missingResultSpec).some((error) => error.includes("requires form.submit.result")),
  "A staged form must transition to a declared result page after completion."
);

assert(runtime.includes("const activeStageIndex = ref("), "The runtime must track the active staged form step.");
assert(runtime.includes("validateFields?.(stageFields.value.map"), "The runtime must validate only the active staged fields.");
assert(runtime.includes("vue-ant-form-confirmation-descriptions"), "The runtime must render the final confirmation with Ant Descriptions.");
assert(runtime.includes("completionOpen.value"), "The runtime must replace completed staged forms with the result page.");
assert(formPack.includes("steps[].fieldKeys"), "The Form Context Pack must document staged field ownership.");

console.log("Vue/Ant staged form flow checks passed.");
