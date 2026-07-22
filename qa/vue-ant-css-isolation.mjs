import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertVueAntCssIsolation } from "../tools/lib/vue-ant-css-isolation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sharedCss = fs.readFileSync(path.join(root, "design-system", "components.css"), "utf8");
const runtimeCss = fs.readFileSync(path.join(root, "design-system", "vue-ant", "page-runtime.css"), "utf8");

assertVueAntCssIsolation({ sharedCss, runtimeCss });

const invalidCases = [
  { sharedCss: "table { min-width: 1180px; }", runtimeCss: "" },
  { sharedCss: "button, input { font: inherit; }", runtimeCss: "" },
  { sharedCss: ".owned-surface { color: inherit; }", runtimeCss: ".ant-descriptions-row { display: block; }" }
];

invalidCases.forEach((fixture) => {
  let rejected = false;
  try {
    assertVueAntCssIsolation(fixture);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("CSS isolation checker accepted an unsafe fixture.");
});

console.log("Vue/Ant CSS isolation checks passed.");
