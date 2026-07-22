import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.css"), "utf8");
const runtime = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.js"), "utf8");
const formRules = fs.readFileSync(path.join(root, "specs", "form-pattern-rules.md"), "utf8");
const formPack = fs.readFileSync(path.join(root, "context-packs", "admin-pc-ant-form.md"), "utf8");
const settlerSpec = fs.readFileSync(path.join(root, "qa", "vue-ant-poc", "change-settler", "page-spec.yaml"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const singleSurfaceSelector = /#page-content\.page\[data-runtime="vue-ant"\]\[data-page-family="form"\]\[data-content-surface="single"\]\s*\{[^}]*background:\s*var\(--bg-page, rgba\(0, 0, 0, 0\.04\)\);/s;
const singleFormSurface = /#page-content\.page\[data-runtime="vue-ant"\]\[data-page-family="form"\]\[data-content-surface="single"\] \.vue-ant-form-page\s*\{[^}]*min-height:\s*100%;[^}]*padding:\s*32px;[^}]*background:\s*#fff;/s;
const groupedFormSurface = /#page-content\.page\[data-runtime="vue-ant"\]\[data-content-surface="grouped"\] \.vue-ant-form-page\s*\{[^}]*padding:\s*20px;[^}]*background:\s*transparent;[^}]*border-radius:\s*0;/s;
const groupedFixedActions = /\.admin-shell\[data-secondary-state="expanded"\] #page-content\.page\[data-runtime="vue-ant"\]\[data-content-surface="grouped"\] \.vue-ant-sticky-actions\s*\{[^}]*position:\s*fixed;[^}]*bottom:\s*var\(--footer-height\);[^}]*left:\s*calc\(var\(--shell-icon-width\) \+ var\(--shell-menu-width\) \+ var\(--space-4\)\);/s;

assert(singleSurfaceSelector.test(styles), "Single forms must retain the gray page canvas outside the content surface.");
assert(singleFormSurface.test(styles), "Single forms must render one complete white content surface.");
assert(groupedFormSurface.test(styles), "Grouped forms must not render an extra white outer content surface.");
assert(groupedFixedActions.test(styles), "Grouped-form actions must stay fixed above the Shell footer.");
assert(styles.includes(".vue-ant-form-page.is-grouped-page"), "Grouped forms must carry a direct root style independent of page mount attributes.");
assert(/\.vue-ant-form-group-card\s*\{[^}]*background:\s*#fff;/s.test(styles), "Grouped forms must retain white information-group cards.");
assert(formRules.includes("16px 灰色工作区 + 整块白色表单面"), "Form pattern rules must document the single-surface rule.");
assert(formPack.includes("16px 灰色工作区 + 整块白色表单面"), "Form Context Pack must document the single-surface rule.");
assert(formPack.includes("外层不能使用整块白色背景或圆角 Card"), "Form Context Pack must prohibit an outer white grouped-form surface.");
assert(formPack.includes("版权栏上方，不随表单内容滚动"), "Form Context Pack must document fixed grouped-form actions.");
assert(settlerSpec.includes("form.sideIllustration"), "The change-settler fixture must exercise the single form surface.");
assert(!settlerSpec.includes("form.groups"), "The change-settler fixture must not opt into grouped form surfaces.");
assert(runtime.includes('"is-grouped-page": groupedLayout'), "The runtime must mark grouped-form roots directly.");

console.log("Vue/Ant page surface checks passed.");
