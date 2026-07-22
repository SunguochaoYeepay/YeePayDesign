import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readYamlPageSpec,
  validateVueAntPageSpec
} from "../tools/lib/vue-ant-page-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.js"), "utf8");
const listPack = fs.readFileSync(path.join(root, "context-packs", "admin-pc-ant-list.md"), "utf8");
const baseSpec = readYamlPageSpec(path.join(root, "qa", "vue-ant-poc", "list-simple-operations", "page-spec.yaml"));

const explicitSummarySpec = structuredClone(baseSpec);
explicitSummarySpec.content.capabilities.push("summary.count");
explicitSummarySpec.table.summary = {
  items: [
    { type: "value", label: "共", value: 24, suffix: "条规则" },
    { type: "value", label: "生效中", value: 18, suffix: "条" }
  ]
};

assert.deepEqual(validateVueAntPageSpec(explicitSummarySpec), [], "Explicit business summary values must be valid.");

const missingValueSpec = structuredClone(explicitSummarySpec);
delete missingValueSpec.table.summary.items[0].value;
assert.ok(
  validateVueAntPageSpec(missingValueSpec).some((error) => error.includes("value must be a finite number")),
  "Explicit summary values must reject missing values."
);

const derivedFieldSpec = structuredClone(explicitSummarySpec);
derivedFieldSpec.table.summary.items[0].field = "status";
assert.ok(
  validateVueAntPageSpec(derivedFieldSpec).some((error) => error.includes("value must not declare field or equals")),
  "Explicit summary values must reject row-derived fields."
);

assert(runtime.includes('if (item.type === "value") return `${item.label} ${item.value}${item.suffix}`;'), "The runtime must render explicit summary values without row aggregation.");
assert(listPack.includes("业务明确提供的独立统计值"), "The List Context Pack must document explicit summary values.");

console.log("Vue/Ant explicit list summary checks passed.");
