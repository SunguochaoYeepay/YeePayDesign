import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.css"), "utf8");
const formRules = fs.readFileSync(path.join(root, "specs", "form-pattern-rules.md"), "utf8");
const formPack = fs.readFileSync(path.join(root, "context-packs", "admin-pc-ant-form.md"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tabletBlock = styles.match(/@media \(max-width: 960px\) \{([\s\S]*?)\n\}/)?.[1] || "";
const mobileBlock = styles.match(/@media \(max-width: 767px\) \{([\s\S]*?)\n\}/)?.[1] || "";

assert(!tabletBlock.includes(".vue-ant-form-layout"), "Side illustration must not collapse below 960px.");
assert(!tabletBlock.includes(".vue-ant-illustration"), "Side illustration must not move below the form at tablet widths.");
assert(/\.vue-ant-form-layout\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/s.test(mobileBlock), "Mobile layout must collapse to a single form column.");
assert(/\.vue-ant-illustration\s*\{\s*display:\s*none;/s.test(mobileBlock), "Mobile layout must hide the side illustration.");
assert(formRules.includes("不在中间宽度换到表单之后"), "Form rules must document the fixed desktop/tablet side illustration layout.");
assert(formPack.includes("不得在中间宽度移到表单之后"), "Form Context Pack must document the fixed desktop/tablet side illustration layout.");

console.log("Vue/Ant side illustration responsive checks passed.");
