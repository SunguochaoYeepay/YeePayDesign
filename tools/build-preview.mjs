import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = process.argv[2] || "page-content.html";
const output = process.argv[3] || "preview.html";

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const tokens = read("design-system/tokens.css");
const components = read("design-system/components.css");
const shell = read("shell/app-shell.html");
const shellInteractions = read("shell/shell-interactions.js");
const contentFile = path.join(root, input);

if (!fs.existsSync(contentFile)) {
  console.error(`Missing content file: ${input}`);
  process.exit(1);
}

const rawContent = fs.readFileSync(contentFile, "utf8");

function extractPageInner(html) {
  const match = html.match(/<section[^>]*id=["']page-content["'][^>]*>([\s\S]*?)<\/section>\s*$/i);
  return match ? match[1].trim() : html.trim();
}

const pageInner = extractPageInner(rawContent);
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
