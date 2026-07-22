import path from "node:path";
import contract from "./lib/vue-ant-page-contract.bundle.cjs";

const {
  readYamlPageSpec,
  toVueAntPageDeclaration,
  writeVueAntPageContent
} = contract;

const [specFile, outputFile] = process.argv.slice(2);

if (!specFile || !outputFile) {
  console.error("Usage: node tools/render-vue-ant-page.mjs <page-spec.yaml> <page-content.html>");
  process.exit(1);
}

try {
  const spec = readYamlPageSpec(path.resolve(specFile));
  const declaration = toVueAntPageDeclaration(spec);
  writeVueAntPageContent(path.resolve(outputFile), declaration);
  console.log(`Rendered Vue/Ant ${declaration.page.family} content: ${outputFile}`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
