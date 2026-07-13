import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const watchMode = args.includes("--watch");
const [input = "page-content.html", output = "preview.html"] = args.filter((arg) => arg !== "--watch");

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const contentFile = path.join(root, input);

function extractPageInner(html) {
  const match = html.match(/<section[^>]*id=["']page-content["'][^>]*>([\s\S]*?)<\/section>\s*$/i);
  return match ? match[1].trim() : html.trim();
}

function buildPreview() {
  if (!fs.existsSync(contentFile)) {
    console.error(`Missing content file: ${input}`);
    return false;
  }

  const tokens = read("design-system/tokens.css");
  const components = read("design-system/components.css");
  const shell = read("shell/app-shell.html");
  const shellInteractions = read("shell/shell-interactions.js");
  const pageInner = extractPageInner(fs.readFileSync(contentFile, "utf8"));
  const hydratedShell = shell.replace(
    /<section id="page-content" class="page">[\s\S]*?<\/section>/,
    `<section id="page-content" class="page">\n${pageInner}\n    </section>`
  );
  const preview = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>老板管账后台原型预览</title>
  <style>
${tokens}

${components}
  </style>
</head>
<body>
${hydratedShell}
<script>${shellInteractions}</script>
</body>
</html>
`;

  fs.writeFileSync(path.join(root, output), preview);
  console.log(`Generated ${output} from ${input}`);
  return true;
}

const generated = buildPreview();
if (!generated && !watchMode) process.exit(1);

if (watchMode) {
  const watchedFiles = [
    "design-system/tokens.css",
    "design-system/components.css",
    "shell/app-shell.html",
    "shell/shell-interactions.js",
    input
  ].map((file) => path.join(root, file));
  let timer;
  const scheduleBuild = () => {
    clearTimeout(timer);
    timer = setTimeout(buildPreview, 80);
  };

  watchedFiles.forEach((file) => fs.watch(file, scheduleBuild));
  console.log("Watching Shell, styles, interactions, and page content for changes.");
}
