import path from "node:path";
import contract from "./lib/vue-ant-page-contract.bundle.cjs";

const {
  readYamlPageSpec,
  validateVueAntPageSpec
} = contract;

const [specFile] = process.argv.slice(2);

if (!specFile) {
  console.error("Usage: node tools/check-vue-ant-contract.mjs <page-spec.yaml>");
  process.exit(1);
}

try {
  const errors = validateVueAntPageSpec(readYamlPageSpec(path.resolve(specFile)));
  if (errors.length) {
    errors.forEach((error) => console.error(`FAIL: ${error}`));
    process.exit(1);
  }
  console.log("Vue/Ant Page Spec valid.");
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
