import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.css"), "utf8");
const detailRules = fs.readFileSync(path.join(root, "specs", "detail-pattern-rules.md"), "utf8");
const detailPack = fs.readFileSync(path.join(root, "context-packs", "admin-pc-ant-detail.md"), "utf8");
const drawerSpec = fs.readFileSync(path.join(root, "qa", "vue-ant-poc", "detail-drawer-record", "page-spec.yaml"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(runtime.includes('class: "vue-ant-detail-drawer-content"'), "Drawer detail content must have an owned layout wrapper.");
assert(runtime.includes('class: "vue-ant-detail-drawer-actions"'), "Drawer detail Footer must have an owned action wrapper.");
assert(runtime.includes('action.key === "close"'), "Drawer acknowledgement actions must close the overlay through an explicit close key.");
assert(runtime.includes("danger: Boolean(actions.primary.danger)"), "Drawer primary actions must pass the declared danger state to Ant Button.");
assert(/\.vue-ant-detail-drawer-content \.vue-ant-detail-group \+ \.vue-ant-detail-group\s*\{[^}]*border-top:\s*0;/s.test(styles), "Drawer groups must not render a separator line.");
assert(/\.vue-ant-detail-drawer-content \.vue-ant-detail-group-header\s*\{[^}]*border-bottom:\s*0;/s.test(styles), "Drawer group titles must not render an underline.");
assert(/\.vue-ant-detail-drawer-actions\s*\{[^}]*justify-content:\s*flex-end;/s.test(styles), "Drawer actions must align to the Footer end.");
assert(detailRules.includes("Drawer 内的多个信息组只用标题与 24px 留白组织"), "Detail pattern rules must document drawer separators.");
assert(detailPack.includes("Footer 内的关闭及后续操作统一右对齐"), "Detail Context Pack must document drawer action alignment.");
assert(drawerSpec.includes("presentation: drawer"), "Drawer fixture must exercise the drawer-specific layout.");
assert(drawerSpec.includes("key: close, label: 我知道了, danger: true"), "Drawer fixture must exercise the acknowledgement close action.");

console.log("Vue/Ant drawer detail layout checks passed.");
