import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readYamlPageSpec,
  validateVueAntPageSpec
} from "../tools/lib/vue-ant-page-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readFixture = (name) => readYamlPageSpec(path.join(root, "qa", "vue-ant-poc", name, "page-spec.yaml"));

const compact = readFixture("list-simple-operations");
const compactSummary = structuredClone(compact);
compactSummary.content.capabilities.push("summary.count");
compactSummary.table.summary = {
  items: [
    { type: "value", label: "共", value: 8, suffix: "条" },
    { type: "value", label: "生效中", value: 6, suffix: "条" }
  ]
};
assert.deepEqual(validateVueAntPageSpec(compactSummary), [], "A one-to-two item compact summary must remain valid.");

const standard = readFixture("list-statistics-standard");
assert.deepEqual(validateVueAntPageSpec(standard), [], "Three-to-five metrics without actions must use valid standard cards.");

const rich = readFixture("list-statistics-rich");
assert.deepEqual(validateVueAntPageSpec(rich), [], "Metric-level actions must use valid rich cards.");

const tooManyCompactItems = structuredClone(compactSummary);
tooManyCompactItems.table.summary.items.push({ type: "value", label: "异常", value: 2, suffix: "条" });
assert.ok(
  validateVueAntPageSpec(tooManyCompactItems).some((error) => error.includes("1 to 2 compact summary items")),
  "Three compact summary metrics must be rejected in favor of cards."
);

const richWithoutAction = structuredClone(rich);
richWithoutAction.statistics.items.forEach((item) => { delete item.action; });
assert.ok(
  validateVueAntPageSpec(richWithoutAction).some((error) => error.includes("requires an action")),
  "Rich cards must be reserved for metric-level actions."
);

const mixedModes = structuredClone(standard);
mixedModes.content.capabilities.push("summary.count");
mixedModes.table.summary = { items: [{ type: "value", label: "共", value: 8, suffix: "条" }] };
assert.ok(
  validateVueAntPageSpec(mixedModes).some((error) => error.includes("either compact table.summary or statistics cards")),
  "Compact summaries and statistic cards must not be mixed."
);

console.log("Vue/Ant statistics layout selection checks passed.");
