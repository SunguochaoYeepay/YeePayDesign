import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readYamlPageSpec, validateVueAntPageSpec } from "../tools/lib/vue-ant-page-contract.mjs";
import { loadGenerationPolicy } from "../tools/lib/generation-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(root, "qa", "vue-ant-poc", "list-drawer-workflow", "page-spec.yaml");
const spec = readYamlPageSpec(fixturePath);
const runtime = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.css"), "utf8");
const listPack = fs.readFileSync(path.join(root, "context-packs", "admin-pc-ant-list.md"), "utf8");
const policy = loadGenerationPolicy(root);

assert.deepEqual(validateVueAntPageSpec(spec), [], "Drawer workflow fixture must satisfy the Page Spec contract.");
assert(spec.content.capabilities.includes("list.workflow.createDrawer"), "Fixture must declare the create drawer capability.");
assert(spec.content.capabilities.includes("list.workflow.detailDrawer"), "Fixture must declare the detail drawer capability.");
assert.equal(spec.workflow.createDrawer.trigger, spec.table.primaryAction.key, "Create drawer trigger must be the primary action.");
assert.equal(spec.workflow.detailDrawer.trigger, spec.table.rowActions[0].key, "Detail drawer trigger must be a row action.");
assert(policy.validatedCombinations.some((item) => item.id === "list.drawer-workflow"), "Live policy must expose the list drawer workflow.");

const missingMapping = structuredClone(spec);
delete missingMapping.workflow.createDrawer.addRow.fields.status;
assert.ok(validateVueAntPageSpec(missingMapping).some((error) => error.includes("must map table column status")), "Create drawers must map every display column.");

const mismatchedTrigger = structuredClone(spec);
mismatchedTrigger.workflow.createDrawer.trigger = "add";
assert.ok(validateVueAntPageSpec(mismatchedTrigger).some((error) => error.includes("must match table.primaryAction.key")), "Create drawers must be bound to the declared primary action.");

const invalidDetail = structuredClone(spec);
delete invalidDetail.workflow.detailDrawer.groups[0].fields[0].sourceKey;
assert.ok(validateVueAntPageSpec(invalidDetail).some((error) => error.includes("sourceKey is required")), "Detail fields must map to the clicked record.");

assert(runtime.includes("function openCreateDrawer()"), "Runtime must open the declared create drawer.");
assert(runtime.includes("async function saveCreateDrawer()"), "Runtime must validate and save the create drawer.");
assert(runtime.includes("sourceRows.value = [record, ...sourceRows.value]"), "Runtime must insert a saved record at the start of the current list.");
assert(runtime.includes("function openDetailDrawer(record)"), "Runtime must open details for the clicked record.");
assert(runtime.includes("activeDetailRecord.value?.[field.sourceKey]"), "Runtime must render drawer details from the clicked record.");
assert(styles.includes(".vue-ant-workflow-drawer-actions"), "Workflow drawers must have an owned footer action layout.");
assert(listPack.includes("列表内抽屉工作流"), "List Context Pack must document the controlled workflow.");

console.log("Vue/Ant list drawer workflow checks passed.");
