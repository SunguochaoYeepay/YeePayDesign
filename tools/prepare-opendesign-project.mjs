import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGenerationPolicy } from "./lib/generation-policy.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetRoot = process.argv[2] ? path.resolve(process.argv[2]) : null;
const runtimeDirectories = ["design-system", "shell", "tools", "context-packs"];
const supportingFiles = ["docs/business-user-guide.md", "prompts/acceptance-baseline.md"];
const markerPath = path.join(targetRoot || "", ".opendesign-framework.json");
const vueAntRuntimeFiles = [
  "design-system/vue-ant/dist/runtime.js",
  "design-system/vue-ant/dist/runtime.css",
  "design-system/vue-ant/dist/runtime-manifest.json"
];
const agentBlockStart = "<!-- admin-pc-ant-policy:begin -->";
const agentBlockEnd = "<!-- admin-pc-ant-policy:end -->";

if (!targetRoot) {
  console.error("Usage: node tools/prepare-opendesign-project.mjs <open-design-project-directory>");
  process.exit(1);
}

if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
  console.error(`OpenDesign project directory does not exist: ${targetRoot}`);
  process.exit(1);
}

const missingVueAntRuntime = vueAntRuntimeFiles.filter((file) => !fs.existsSync(path.join(sourceRoot, file)));
if (missingVueAntRuntime.length) {
  console.error(`Vue/Ant runtime is not built: ${missingVueAntRuntime.join(", ")}. Run npm install and npm run build:vue-ant-runtime in the framework project first.`);
  process.exit(1);
}

const existingMarker = fs.existsSync(markerPath) ? JSON.parse(fs.readFileSync(markerPath, "utf8")) : null;
const generationPolicy = loadGenerationPolicy(sourceRoot);

function managedAgentBlock(policy) {
  return `${agentBlockStart}
# Admin PC Ant MCP 受控生成规则

本项目的页面族、模板、能力状态和 Page Spec 合法组合以 MCP 实时策略为唯一依据，当前策略版本为
\`${policy.policyVersion}\`。不得依据旧对话、截图、缓存、文档或本文件之外的页面族名单判断是否支持。

处理每个业务需求时，必须按以下顺序调用 MCP：检查项目；必要时初始化；读取
\`admin_ui_get_generation_policy\`；仅从其 \`availableFamilies\` 选择页面族；读取对应页面族契约；
写入 Page Spec 并构建。若实时策略与任何旧指引冲突，以实时策略为准。

业务人员只提供业务需求。不得要求其提供页面类型、模板、组件、Vue、HTML、CSS、路径或构建命令；
也不得手写或修改派生产物。
${agentBlockEnd}`;
}

function isLegacyManagedAgent(source) {
  return source.includes("当前工作区的 MCP 项目标识")
    && source.includes("当前支持 `form`、`list`")
    && source.includes("不得手写 HTML、Vue、CSS、JavaScript");
}

function synchronizeAgentInstructions(root, policy) {
  const destination = path.join(root, "AGENTS.md");
  const existing = fs.existsSync(destination) ? fs.readFileSync(destination, "utf8") : "";
  const block = managedAgentBlock(policy);
  const start = existing.indexOf(agentBlockStart);
  const end = existing.indexOf(agentBlockEnd);
  let next;
  if (start >= 0 && end >= start) {
    next = `${existing.slice(0, start).trimEnd()}\n\n${block}\n${existing.slice(end + agentBlockEnd.length).trimStart()}`;
  } else if (isLegacyManagedAgent(existing)) {
    next = `${block}\n`;
  } else {
    next = `${existing.trimEnd()}${existing.trim() ? "\n\n" : ""}${block}\n`;
  }
  fs.writeFileSync(destination, next);
}

for (const directory of runtimeDirectories) {
  const source = path.join(sourceRoot, directory);
  const target = path.join(targetRoot, directory);

  if (!fs.existsSync(source)) {
    console.error(`Missing framework directory: ${source}`);
    process.exit(1);
  }

  const targetStats = fs.lstatSync(target, { throwIfNoEntry: false });
  if (targetStats) {
    const managedProject = existingMarker?.frameworkRoot === sourceRoot;
    const managedLink = targetStats.isSymbolicLink() && fs.realpathSync(target) === fs.realpathSync(source);
    if (!managedProject && !managedLink) {
      console.error(`Refusing to replace existing project entry: ${target}`);
      process.exit(1);
    }
    fs.rmSync(target, { recursive: true, force: true });
  }

  // OpenDesign project sandboxes do not expose symbolic links to their Agent.
  fs.cpSync(source, target, { recursive: true, dereference: true });
}

for (const relativeFile of supportingFiles) {
  const source = path.join(sourceRoot, relativeFile);
  const target = path.join(targetRoot, relativeFile);
  if (!fs.existsSync(source)) {
    console.error(`Missing framework support file: ${source}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

synchronizeAgentInstructions(targetRoot, generationPolicy);

const marker = {
  frameworkRoot: sourceRoot,
  linkedDirectories: runtimeDirectories,
  supportingFiles,
  runtimeMode: "copy",
  vueAntRuntime: true,
  policyVersion: generationPolicy.policyVersion,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(markerPath, `${JSON.stringify(marker, null, 2)}\n`);
console.log(`OpenDesign project prepared: ${targetRoot}`);
