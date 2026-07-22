import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.css"), "utf8");
const detailRules = fs.readFileSync(path.join(root, "specs", "detail-pattern-rules.md"), "utf8");
const detailPack = fs.readFileSync(path.join(root, "context-packs", "admin-pc-ant-detail.md"), "utf8");
const anchorSpec = fs.readFileSync(path.join(root, "qa", "vue-ant-poc", "detail-anchors", "page-spec.yaml"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(/\.vue-ant-detail-anchor-layout > \.vue-ant-detail-groups\s*\{[^}]*padding:\s*0 24px 24px;[^}]*background:\s*#fff;/s.test(styles), "Anchor detail pages must provide a white main content surface.");
assert(/\.vue-ant-detail-anchor-nav\s*\{[^}]*background:\s*#fff;/s.test(styles), "Anchor detail pages must retain a white navigation card.");
assert(detailRules.includes("右侧一整块白色主内容面"), "Detail pattern rules must document the anchor detail white content surface.");
assert(detailPack.includes("右侧一整块白色主内容面"), "Detail Context Pack must document the anchor detail white content surface.");
assert(anchorSpec.includes("detail.anchors"), "Anchor fixture must exercise the complex detail layout.");

console.log("Vue/Ant anchor detail surface checks passed.");
