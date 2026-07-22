import fs from "node:fs";
import path from "node:path";

const [input = "page-content.html"] = process.argv.slice(2);
const page = fs.readFileSync(input, "utf8");
const sprite = fs.readFileSync(path.join("design-system", "icons", "ant", "sprite.svg"), "utf8");
const allowed = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]));
const used = [...page.matchAll(/data-icon=["']([^"']+)["']/g)].map((match) => match[1]);
const unknown = [...new Set(used.filter((name) => !allowed.has(name)))];
const pseudoIconDrawing = /(?:\[data-icon[^\{]*|\.ui-icon[^\{]*|\.ui-state-icon[^\{]*)::(?:before|after)[^{]*\{[^}]*\bcontent\s*:/gs.test(page);

if (unknown.length) {
  console.error(`Unknown PC Ant icon semantic(s): ${unknown.join(", ")}`);
}
if (pseudoIconDrawing) {
  console.error("Icon CSS pseudo-element drawing is forbidden. Use the Ant SVG sprite through .ui-icon[data-icon].");
}
if (unknown.length || pseudoIconDrawing) process.exit(1);

console.log(`PC Ant icons valid: ${used.length} reference(s), ${new Set(used).size} semantic icon(s).`);
