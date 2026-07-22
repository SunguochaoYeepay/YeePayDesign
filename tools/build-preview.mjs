import fs from "node:fs";
import path from "node:path";
import { assertVueAntCssIsolation } from "./lib/vue-ant-css-isolation.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const watchMode = args.includes("--watch");
const [input = "page-content.html", output = "preview.html"] = args.filter((arg) => arg !== "--watch");

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const contentFile = path.join(root, input);

function isVueAntPage(html) {
  return /<section\b[^>]*\bid=["']page-content["'][^>]*\bdata-runtime=["']vue-ant["']/i.test(html)
    || /<script\b[^>]*\bdata-admin-pc-vue-page\b/i.test(html);
}

function extractPageInner(html) {
  const match = html.match(/<section[^>]*id=["']page-content["'][^>]*>([\s\S]*?)<\/section>\s*$/i);
  return match ? match[1].trim() : html.trim();
}

function extractShellMetadata(html) {
  const section = html.match(/<section\b[^>]*id=["']page-content["'][^>]*>/i)?.[0] || "";
  return [...section.matchAll(/\s(data-shell-[\w-]+=(?:"[^"]*"|'[^']*'))/gi)]
    .map((match) => match[1])
    .join(" ");
}

function buildPreview() {
  if (!fs.existsSync(contentFile)) {
    console.error(`Missing content file: ${input}`);
    return false;
  }

  const tokens = read("design-system/tokens.css");
  const components = read("design-system/components.css");
  const iconRuntime = read("design-system/icon-runtime.js");
  const iconSpriteMarkup = read("design-system/icons/ant/sprite.svg");
  const logoDataUri = `data:image/png;base64,${fs.readFileSync(path.join(root, "shell", "assets", "logo-vertical.png")).toString("base64")}`;
  const shell = read("shell/app-shell.html");
  const shellInteractions = read("shell/shell-interactions.js");
  const pageHtml = fs.readFileSync(contentFile, "utf8");
  if (!isVueAntPage(pageHtml)) {
    console.error("All admin-pc-ant previews require a Vue/Ant declarative page. Render page-content.html from a Page Spec first.");
    return false;
  }
  const vueAntCssPath = "design-system/vue-ant/dist/runtime.css";
  const vueAntRuntimePath = "design-system/vue-ant/dist/runtime.js";
  if (!fs.existsSync(path.join(root, vueAntCssPath)) || !fs.existsSync(path.join(root, vueAntRuntimePath))) {
    console.error("Vue/Ant runtime bundle is missing. Run npm run build:vue-ant-runtime before building this preview.");
    return false;
  }
  const vueAntCss = read(vueAntCssPath);
  const vueAntRuntime = read(vueAntRuntimePath);
  assertVueAntCssIsolation({ sharedCss: components, runtimeCss: vueAntCss });
  const pageInner = extractPageInner(pageHtml);
  const shellMetadata = extractShellMetadata(pageHtml);
  const outputFile = path.resolve(root, output);
  const hydratedShell = shell.replace(
    /<section id="page-content" class="page">[\s\S]*?<\/section>/,
    `<section id="page-content" class="page"${shellMetadata ? ` ${shellMetadata}` : ""}>\n${pageInner}\n    </section>`
  ).replace('src="shell/assets/logo-vertical.png"', `src="${logoDataUri}"`);
  const preview = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>老板管账后台原型预览</title>
  <style>
${tokens}

${components}

${vueAntCss}
  </style>
</head>
<body>
<div hidden aria-hidden="true">${iconSpriteMarkup}</div>
${hydratedShell}
<script>${iconRuntime}</script>
<script>${shellInteractions}</script>
<script>${vueAntRuntime}</script>
</body>
</html>
`;

  fs.writeFileSync(outputFile, preview);
  console.log(`Generated ${output} from ${input}`);
  return true;
}

const generated = buildPreview();
if (!generated && !watchMode) process.exit(1);

if (watchMode) {
  const watchedFiles = [
    "design-system/tokens.css",
    "design-system/components.css",
    "design-system/icon-runtime.js",
    "design-system/vue-ant/dist/runtime.css",
    "design-system/vue-ant/dist/runtime.js",
    "design-system/icons/ant/sprite.svg",
    "shell/app-shell.html",
    "shell/shell-interactions.js",
    input
  ];
  let timer;
  const scheduleBuild = () => {
    clearTimeout(timer);
    timer = setTimeout(buildPreview, 80);
  };

  watchedFiles.map((file) => path.join(root, file)).forEach((file) => fs.watch(file, scheduleBuild));
  console.log("Watching Shell, styles, interactions, and page content for changes.");
}
