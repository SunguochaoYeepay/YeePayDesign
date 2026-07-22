import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as z from "zod/v4";
import YAML from "yaml";
import contract from "../tools/lib/vue-ant-page-contract.bundle.cjs";
import {
  availableFamilies,
  findFamily,
  loadGenerationPolicy,
  policyRelativePath
} from "../tools/lib/generation-policy.mjs";

const { validateVueAntPageSpec } = contract;

export const frameworkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const generationPolicy = loadGenerationPolicy(frameworkRoot);
export const quickEntryFamilyIds = availableFamilies(generationPolicy).map((family) => family.id);
export const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens.");
export const projectRuntimePaths = [
  "context-packs/admin-pc-ant-core.md",
  "context-packs/index.md",
  policyRelativePath,
  "design-system/tokens.css",
  "design-system/components.css",
  "design-system/icon-runtime.js",
  "design-system/icons/ant/sprite.svg",
  "design-system/vue-ant/dist/runtime.js",
  "design-system/vue-ant/dist/runtime.css",
  "design-system/vue-ant/dist/runtime-manifest.json",
  "shell/app-shell.html",
  "shell/shell-interactions.js",
  "shell/assets/logo-vertical.png",
  "tools/build-vue-ant-page.mjs",
  "tools/check-admin-pc-content.mjs",
  "tools/build-preview.mjs",
  "tools/lib/vue-ant-page-contract.bundle.cjs",
  "docs/business-user-guide.md",
  "prompts/acceptance-baseline.md",
  "AGENTS.md"
];

export function textResult(payload, isError = false) {
  return {
    content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {})
  };
}

export function toProjectRoot(projectRoot) {
  return path.resolve(projectRoot);
}

export function inspectProject(projectRoot) {
  const root = toProjectRoot(projectRoot);
  const rootExists = fs.existsSync(root) && fs.statSync(root).isDirectory();
  let projectPolicyVersion = null;
  if (rootExists) {
    try {
      projectPolicyVersion = JSON.parse(fs.readFileSync(path.join(root, ".opendesign-framework.json"), "utf8")).policyVersion || null;
    } catch {
      projectPolicyVersion = null;
    }
  }
  const isFrameworkProject = root === frameworkRoot;
  if (isFrameworkProject) projectPolicyVersion = generationPolicy.policyVersion;
  const policySynchronized = isFrameworkProject || projectPolicyVersion === generationPolicy.policyVersion;
  const missingPaths = rootExists
    ? projectRuntimePaths.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)))
    : ["project-root-directory"];
  return {
    activeProjectRoot: root,
    initialized: rootExists && missingPaths.length === 0 && policySynchronized,
    missingPaths,
    policyVersion: generationPolicy.policyVersion,
    projectPolicyVersion,
    policySynchronized,
    writable: rootExists && (() => {
      try {
        fs.accessSync(root, fs.constants.W_OK);
        return true;
      } catch {
        return false;
      }
    })()
  };
}

function runNode(root, tool, args) {
  const result = spawnSync(process.execPath, [tool, ...args], {
    cwd: root,
    encoding: "utf8"
  });
  return {
    ok: result.status === 0 && !result.error,
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error?.message || null
  };
}

function featurePaths(projectRoot, featureSlug, pageSlug) {
  const relativeDirectory = path.posix.join("outputs", "features", featureSlug, pageSlug);
  const absoluteDirectory = path.join(projectRoot, ...relativeDirectory.split("/"));
  return {
    featureSlug,
    pageSlug,
    relativeDirectory,
    absoluteDirectory,
    pageSpec: path.posix.join(relativeDirectory, "page-spec.yaml"),
    pageContent: path.posix.join(relativeDirectory, "page-content.html"),
    checklist: path.posix.join(relativeDirectory, "checklist.md"),
    preview: path.posix.join(relativeDirectory, "preview.html")
  };
}

/**
 * Registers the deterministic page pipeline against either a direct filesystem
 * project root (stdio) or an allowlisted project identifier (HTTP gateway).
 */
export function registerProjectPipelineTools(server, options) {
  const {
    projectArgument,
    projectSchema,
    resolveProject,
    projectIdentity,
    presentArtifacts,
    initializationOutput = (result) => result.stdout.trim(),
    initializationFailure = (result) => ({
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      detail: result.error
    }),
    buildOutput = (result) => result.stdout.trim(),
    buildFailure = (result) => ({
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      detail: result.error
    })
  } = options;
  const projectInput = { [projectArgument]: projectSchema };

  function resolveContext(args) {
    const value = args[projectArgument];
    const resolved = resolveProject(value);
    if (resolved?.error) return { error: textResult(resolved.error, true) };
    if (!resolved?.root) {
      return { error: textResult({ error: "项目不可用" }, true) };
    }
    return { context: { ...resolved, root: toProjectRoot(resolved.root) } };
  }

  function publicStatus(status, context) {
    return {
      ...projectIdentity(context),
      initialized: status.initialized,
      missingPaths: status.missingPaths,
      policyVersion: status.policyVersion,
      projectPolicyVersion: status.projectPolicyVersion,
      policySynchronized: status.policySynchronized,
      writable: status.writable
    };
  }

  function initializedOrError(context) {
    const status = inspectProject(context.root);
    if (!status.initialized || !status.writable) {
      return {
        status,
        error: textResult({
          error: "项目未初始化",
          ...publicStatus(status, context)
        }, true)
      };
    }
    return { status };
  }

  server.registerTool("admin_ui_get_generation_policy", {
    title: "读取当前生成策略",
    description: "返回 MCP 当前版本的可用页面族与 Context Pack 映射。所有业务需求必须先以此结果判断支持范围，不得使用旧对话或项目提示中的页面族名单。",
    inputSchema: {},
    annotations: { readOnlyHint: true }
  }, async () => textResult({
    policyVersion: generationPolicy.policyVersion,
    availableFamilies: availableFamilies(generationPolicy).map(({ id, evidence, contextPack }) => ({ id, evidence, contextPack })),
    validatedCombinations: generationPolicy.validatedCombinations,
    workflowOnlyFamilies: generationPolicy.pageFamilies
      .filter((family) => !family.quickEntry)
      .map(({ id, evidence, contextPack, availability }) => ({ id, evidence, contextPack, availability })),
    requiredWorkflow: [
      "先检查项目策略版本。",
      "再读取当前策略并依据 availableFamilies 选择页面族。",
      "随后读取所选页面族契约。"
    ]
  }));

  server.registerTool("admin_ui_inspect_project", {
    title: "检查后台原型项目",
    description: "检查指定项目是否具备 Vue/Ant 页面构建所需的固定运行资源。不会修改文件。",
    inputSchema: projectInput,
    annotations: { readOnlyHint: true }
  }, async (args) => {
    const resolved = resolveContext(args);
    if (resolved.error) return resolved.error;
    return textResult(publicStatus(inspectProject(resolved.context.root), resolved.context));
  });

  server.registerTool("admin_ui_initialize_project", {
    title: "初始化后台原型项目",
    description: "将固定运行资源复制到已登记且可写的项目目录。",
    inputSchema: projectInput,
    annotations: { destructiveHint: false, idempotentHint: true }
  }, async (args) => {
    const resolved = resolveContext(args);
    if (resolved.error) return resolved.error;
    const { context } = resolved;
    if (!fs.existsSync(context.root) || !fs.statSync(context.root).isDirectory()) {
      return textResult({ error: "目标项目目录不存在", ...projectIdentity(context) }, true);
    }

    const result = runNode(frameworkRoot, "tools/prepare-opendesign-project.mjs", [context.root]);
    if (!result.ok) {
      return textResult({
        error: "项目初始化失败",
        ...projectIdentity(context),
        ...initializationFailure(result, context)
      }, true);
    }
    const status = inspectProject(context.root);
    return textResult({
      ...publicStatus(status, context),
      output: initializationOutput(result, context, status)
    });
  });

  server.registerTool("admin_ui_get_page_contract", {
    title: "读取页面族契约",
    description: "读取当前初始化项目中的 Core、路由索引和一个实时策略允许的页面族 Context Pack。页面族只能来自 admin_ui_get_generation_policy 的 availableFamilies。",
    inputSchema: {
      ...projectInput,
      family: z.enum(quickEntryFamilyIds)
    },
    annotations: { readOnlyHint: true }
  }, async (args) => {
    const resolved = resolveContext(args);
    if (resolved.error) return resolved.error;
    const initialized = initializedOrError(resolved.context);
    if (initialized.error) return initialized.error;
    const family = findFamily(generationPolicy, args.family);
    if (!family?.quickEntry) {
      return textResult({
        error: "页面族未在当前快速入口开放",
        policyVersion: generationPolicy.policyVersion,
        family: args.family
      }, true);
    }
    const files = [
      "context-packs/admin-pc-ant-core.md",
      "context-packs/index.md",
      `context-packs/${family.contextPack}`
    ];
    return textResult({
      ...projectIdentity(resolved.context),
      policyVersion: generationPolicy.policyVersion,
      family: args.family,
      packs: Object.fromEntries(files.map((relativePath) => [
        relativePath,
        fs.readFileSync(path.join(resolved.context.root, relativePath), "utf8")
      ]))
    });
  });

  server.registerTool("admin_ui_write_page_spec", {
    title: "写入 Vue/Ant Page Spec",
    description: "验证并写入一个当前策略允许的 Page Spec v2。仅允许写入 outputs/features/<feature>/<page>/page-spec.yaml，不生成 HTML。",
    inputSchema: {
      ...projectInput,
      featureSlug: slugSchema,
      pageSlug: slugSchema,
      pageSpecYaml: z.string().min(1).max(500000)
    },
    annotations: { destructiveHint: false, idempotentHint: true }
  }, async (args) => {
    const resolved = resolveContext(args);
    if (resolved.error) return resolved.error;
    const initialized = initializedOrError(resolved.context);
    if (initialized.error) return initialized.error;

    let spec;
    try {
      spec = YAML.parse(args.pageSpecYaml);
    } catch (error) {
      return textResult({ error: "Page Spec YAML 无法解析", detail: error.message }, true);
    }
    const family = findFamily(generationPolicy, spec?.page?.family);
    if (!family?.quickEntry) {
      return textResult({
        error: "Page Spec 页面族未在当前快速入口开放",
        policyVersion: generationPolicy.policyVersion,
        availableFamilies: quickEntryFamilyIds,
        family: spec?.page?.family || null
      }, true);
    }
    const errors = validateVueAntPageSpec(spec, { requireExplicitFormTemplate: true });
    if (errors.length) return textResult({ error: "Page Spec 不符合 Vue/Ant 契约", errors }, true);

    const paths = featurePaths(resolved.context.root, args.featureSlug, args.pageSlug);
    fs.mkdirSync(paths.absoluteDirectory, { recursive: true });
    const destination = path.join(resolved.context.root, ...paths.pageSpec.split("/"));
    const temporary = `${destination}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, args.pageSpecYaml.endsWith("\n") ? args.pageSpecYaml : `${args.pageSpecYaml}\n`);
    fs.renameSync(temporary, destination);
    const checksum = crypto.createHash("sha256").update(fs.readFileSync(destination)).digest("hex");
    return textResult({
      ...projectIdentity(resolved.context),
      pageSpec: presentArtifacts(resolved.context, paths).pageSpec,
      sha256: checksum,
      nextTool: "admin_ui_build_page"
    });
  });

  server.registerTool("admin_ui_build_page", {
    title: "构建后台页面交付物",
    description: "从已写入的 Page Spec 生成 page-content.html、checklist.md 和 preview.html，并执行固定契约校验。",
    inputSchema: {
      ...projectInput,
      featureSlug: slugSchema,
      pageSlug: slugSchema
    },
    annotations: { destructiveHint: false, idempotentHint: true }
  }, async (args) => {
    const resolved = resolveContext(args);
    if (resolved.error) return resolved.error;
    const initialized = initializedOrError(resolved.context);
    if (initialized.error) return initialized.error;
    const paths = featurePaths(resolved.context.root, args.featureSlug, args.pageSlug);
    const absoluteSpec = path.join(resolved.context.root, ...paths.pageSpec.split("/"));
    if (!fs.existsSync(absoluteSpec)) {
      return textResult({
        error: "找不到 Page Spec",
        ...projectIdentity(resolved.context),
        pageSpec: presentArtifacts(resolved.context, paths).pageSpec
      }, true);
    }

    const result = runNode(resolved.context.root, "tools/build-vue-ant-page.mjs", [
      paths.pageSpec,
      paths.pageContent,
      paths.checklist,
      paths.preview
    ]);
    if (!result.ok) {
      return textResult({
        error: "页面构建阻断",
        ...projectIdentity(resolved.context),
        artifacts: presentArtifacts(resolved.context, paths),
        ...buildFailure(result, resolved.context, paths)
      }, true);
    }

    return textResult({
      ...projectIdentity(resolved.context),
      artifacts: presentArtifacts(resolved.context, paths),
      output: buildOutput(result, resolved.context, paths)
    });
  });
}

export function absoluteArtifactPaths(context, paths) {
  return {
    pageSpec: path.join(context.root, ...paths.pageSpec.split("/")),
    pageContent: path.join(context.root, ...paths.pageContent.split("/")),
    checklist: path.join(context.root, ...paths.checklist.split("/")),
    preview: path.join(context.root, ...paths.preview.split("/"))
  };
}
