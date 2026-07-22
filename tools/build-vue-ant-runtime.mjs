import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { assertVueAntCssIsolation } from "./lib/vue-ant-css-isolation.mjs";

const root = process.cwd();
const source = path.join(root, "design-system", "vue-ant", "page-runtime.js");
const outdir = path.join(root, "design-system", "vue-ant", "dist");
const contractSource = path.join(root, "tools", "lib", "vue-ant-page-contract.mjs");
const contractBundle = path.join(root, "tools", "lib", "vue-ant-page-contract.bundle.cjs");
const sharedComponentsCss = path.join(root, "design-system", "components.css");
const runtimeCss = path.join(root, "design-system", "vue-ant", "page-runtime.css");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

if (!fs.existsSync(source)) {
  console.error("Missing design-system/vue-ant/page-runtime.js");
  process.exit(1);
}

if (!fs.existsSync(contractSource)) {
  console.error("Missing tools/lib/vue-ant-page-contract.mjs");
  process.exit(1);
}

if (!fs.existsSync(sharedComponentsCss)) {
  console.error("Missing design-system/components.css");
  process.exit(1);
}

if (!fs.existsSync(runtimeCss)) {
  console.error("Missing design-system/vue-ant/page-runtime.css");
  process.exit(1);
}

const sharedCss = fs.readFileSync(sharedComponentsCss, "utf8");
const runtimeStyles = fs.readFileSync(runtimeCss, "utf8");
try {
  assertVueAntCssIsolation({ sharedCss, runtimeCss: runtimeStyles });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

fs.mkdirSync(outdir, { recursive: true });

await build({
  bundle: true,
  entryPoints: [source],
  entryNames: "runtime",
  format: "iife",
  globalName: "AdminPcVueAntBundle",
  legalComments: "none",
  minify: false,
  outdir,
  platform: "browser",
  sourcemap: false,
  target: ["es2020"]
});

await build({
  bundle: true,
  entryPoints: [contractSource],
  format: "cjs",
  legalComments: "none",
  minify: false,
  outfile: contractBundle,
  platform: "node",
  sourcemap: false,
  target: ["node20"]
});

fs.rmSync(path.join(root, "tools", "lib", "vue-ant-page-contract.bundle.mjs"), { force: true });

fs.writeFileSync(path.join(outdir, "runtime-manifest.json"), `${JSON.stringify({
  runtime: "vue-ant",
  rendererVersion: 2,
  vue: packageJson.dependencies.vue,
  antDesignVue: packageJson.dependencies["ant-design-vue"],
  icons: packageJson.dependencies["@ant-design/icons-vue"]
}, null, 2)}\n`);

console.log("Built Vue/Ant preview runtime and self-contained contract tooling.");
