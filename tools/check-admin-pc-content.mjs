import fs from "node:fs";
import contract from "./lib/vue-ant-page-contract.bundle.cjs";

const {
  readYamlPageSpec,
  toVueAntPageDeclaration,
  validateVueAntPageSpec
} = contract;

const [contentFile, specFile] = process.argv.slice(2);

if (!contentFile || !specFile) {
  console.error("Usage: node tools/check-admin-pc-content.mjs <page-content.html> <page-spec.yaml>");
  process.exit(1);
}

const page = fs.readFileSync(contentFile, "utf8");
const errors = [];
const rootMatch = page.match(/^\s*<section\b([^>]*)\bid=["']page-content["']([^>]*)>([\s\S]*?)<\/section>\s*$/i);

if (!rootMatch) {
  errors.push("Content must contain exactly one #page-content section and no outer HTML.");
}

const rootAttributes = rootMatch ? `${rootMatch[1]} ${rootMatch[2]}` : "";
if (rootMatch && !/\bclass=["'][^"']*\bpage\b[^"']*["']/i.test(rootAttributes)) {
  errors.push("The #page-content section must include class=page for the fixed 16px frame.");
}
if (rootMatch && !/\bdata-runtime=["']vue-ant["']/i.test(rootAttributes)) {
  errors.push("All admin-pc-ant content must declare data-runtime=vue-ant.");
}
if (/(?:global-sidebar|module-sidebar|\btopbar\b|\badmin-shell\b|\bcopyright\b)/i.test(page)) {
  errors.push("Content must not recreate Shell, navigation, TopBar, or footer.");
}
if (/<style\b/i.test(page)) {
  errors.push("Vue/Ant page content may not include local style blocks.");
}

const declarationMatch = page.match(/<script\b[^>]*\btype=["']application\/json["'][^>]*\bdata-admin-pc-vue-page\b[^>]*>([\s\S]*?)<\/script>/i);
if (!declarationMatch) {
  errors.push("Vue/Ant pages require one data-admin-pc-vue-page JSON declaration.");
}
if ((page.match(/<script\b/gi) || []).length !== 1) {
  errors.push("Page content may only include its JSON declaration; arbitrary page scripts are forbidden.");
}

if (rootMatch && declarationMatch) {
  const remainder = rootMatch[3]
    .replace(/<div\b[^>]*\bdata-admin-pc-vue-root\b[^>]*><\/div>/i, "")
    .replace(declarationMatch[0], "")
    .trim();
  if (remainder) errors.push("Vue/Ant content must contain only the fixed mount root and JSON declaration.");
}

let declaration;
try {
  declaration = JSON.parse(declarationMatch?.[1] || "");
} catch {
  errors.push("The Vue/Ant page declaration must contain valid JSON.");
}

try {
  const pageSpec = readYamlPageSpec(specFile);
  const contractErrors = validateVueAntPageSpec(pageSpec);
  errors.push(...contractErrors);
  if (!contractErrors.length && declaration) {
    const expected = toVueAntPageDeclaration(pageSpec);
    if (JSON.stringify(declaration) !== JSON.stringify(expected)) {
      errors.push("Page content must be generated from the supplied Page Spec; declaration drift detected.");
    }
  }
} catch (error) {
  errors.push(`Unable to validate Vue/Ant Page Spec: ${error.message}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL: ${error}`));
  process.exit(1);
}

console.log("PC Vue/Ant content valid: declarative Page Spec matches rendered content.");
