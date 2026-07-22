import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { validateVueAntPageSpec } from "../tools/lib/vue-ant-page-contract.mjs";
import { loadGenerationPolicy } from "../tools/lib/generation-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spec = YAML.parse(fs.readFileSync(path.join(root, "qa", "vue-ant-poc", "form-single-stage-illustration", "page-spec.yaml"), "utf8"));
const policy = loadGenerationPolicy(root);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!validateVueAntPageSpec(spec, { requireExplicitFormTemplate: true }).length, "Single-stage side illustration fixture must satisfy the Page Spec contract.");
assert(policy.validatedCombinations.some((combination) => combination.id === "form.single-stage.side-illustration"), "Live policy must expose the single-stage side illustration combination.");
assert(spec.template.id === "form.single-stage", "Fixture must use the single-stage template.");
assert(spec.content.capabilities.includes("form.sideIllustration"), "Fixture must declare the side illustration capability.");
assert(!spec.content.capabilities.includes("form.steps"), "Single-stage illustration fixture must not require Steps.");

console.log("Vue/Ant single-stage illustration checks passed.");
