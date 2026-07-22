import { randomUUID } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod/v4";
import {
  frameworkRoot,
  generationPolicy,
  inspectProject,
  registerProjectPipelineTools,
  slugSchema,
  textResult
} from "./admin-prototype-core.mjs";

const DEFAULT_PORT = 4318;
const LOCAL_HOST = "127.0.0.1";
const MAX_BODY_BYTES = 1024 * 1024;
const modulePath = fileURLToPath(import.meta.url);
const projectIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "项目 ID 只能包含小写字母、数字和连字符。");

function defaultRegistry() {
  return new Map([[
    "prototype-poc",
    {
      id: "prototype-poc",
      label: "老板管账后台原型 PoC",
      root: frameworkRoot
    }
  ]]);
}

export function loadLocalProjectRegistry(projectsFile) {
  if (!projectsFile || !fs.existsSync(projectsFile)) return defaultRegistry();

  let source;
  try {
    source = JSON.parse(fs.readFileSync(projectsFile, "utf8"));
  } catch (error) {
    throw new Error(`无法读取本地项目登记文件: ${error.message}`);
  }
  if (source?.schemaVersion !== 1 || !Array.isArray(source.projects)) {
    throw new Error("本地项目登记文件必须使用 schemaVersion: 1 和 projects 数组。");
  }

  const registry = new Map();
  for (const entry of source.projects) {
    const parsed = projectIdSchema.safeParse(entry?.id);
    if (!parsed.success) throw new Error(`项目 ID 不合法: ${entry?.id ?? "(缺失)"}`);
    if (registry.has(entry.id)) throw new Error(`项目 ID 重复: ${entry.id}`);
    if (typeof entry.root !== "string" || !entry.root.trim()) {
      throw new Error(`项目 ${entry.id} 缺少 root 目录。`);
    }
    registry.set(entry.id, {
      id: entry.id,
      label: typeof entry.label === "string" && entry.label.trim() ? entry.label.trim() : entry.id,
      root: path.resolve(path.dirname(projectsFile), entry.root)
    });
  }
  return registry;
}

function publicProjectStatus(project) {
  const status = inspectProject(project.root);
  return {
    projectId: project.id,
    label: project.label,
    initialized: status.initialized,
    writable: status.writable,
    missingPaths: status.missingPaths,
    policyVersion: status.policyVersion,
    projectPolicyVersion: status.projectPolicyVersion,
    policySynchronized: status.policySynchronized
  };
}

function createGatewayMcpServer(registry, getOrigin) {
  const server = new McpServer({
    name: "admin-pc-ant-prototype-local-gateway",
    version: "0.2.0"
  });

  server.registerTool("admin_ui_list_projects", {
    title: "列出本地原型项目",
    description: "列出本机网关已登记的项目及其初始化状态。不会返回本地绝对路径。",
    inputSchema: {},
    annotations: { readOnlyHint: true }
  }, async () => textResult({
    projects: [...registry.values()].map(publicProjectStatus)
  }));

  registerProjectPipelineTools(server, {
    projectArgument: "projectId",
    projectSchema: projectIdSchema,
    resolveProject: (projectId) => {
      const project = registry.get(projectId);
      if (!project) {
        return {
          error: {
            error: "未登记的本地项目",
            projectId,
            availableProjectIds: [...registry.keys()]
          }
        };
      }
      return {
        root: project.root,
        projectId: project.id,
        label: project.label
      };
    },
    projectIdentity: (context) => ({
      projectId: context.projectId,
      label: context.label
    }),
    presentArtifacts: (context, paths) => ({
      pageSpec: paths.pageSpec,
      pageContent: paths.pageContent,
      checklist: paths.checklist,
      preview: paths.preview,
      previewUrl: `${getOrigin()}/projects/${encodeURIComponent(context.projectId)}/previews/${encodeURIComponent(paths.featureSlug)}/${encodeURIComponent(paths.pageSlug)}`
    }),
    initializationOutput: () => "项目初始化完成",
    initializationFailure: (result) => ({
      status: result.status,
      detail: "项目初始化命令失败，请检查本机网关日志。"
    }),
    buildOutput: () => "页面构建完成",
    buildFailure: (result) => ({
      status: result.status,
      detail: "页面构建失败，请检查 Page Spec 和本机网关日志。"
    })
  });

  return server;
}

function jsonResponse(res, statusCode, body) {
  const serialized = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(serialized),
    "Cache-Control": "no-store"
  });
  res.end(serialized);
}

function jsonRpcError(res, statusCode, message) {
  jsonResponse(res, statusCode, {
    jsonrpc: "2.0",
    error: { code: -32000, message },
    id: null
  });
}

function sessionHeader(req) {
  const value = req.headers["mcp-session-id"];
  return Array.isArray(value) ? value[0] : value;
}

function acceptsHtml(req) {
  const value = req.headers.accept;
  const accept = Array.isArray(value) ? value.join(",") : value || "";
  return accept.includes("text/html");
}

function browserMcpEndpointResponse(res, origin) {
  const healthUrl = `${origin}/health`;
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>本地 MCP 网关已运行</title>
</head>
<body>
  <main>
    <h1>本地 MCP 网关已运行</h1>
    <p>这个地址供 MCP 客户端连接，不是普通网页。</p>
    <p>在 Codex、Claude 或 Cursor 的 MCP 配置中填写：<code>${origin}/mcp</code></p>
    <p><a href="${healthUrl}">查看服务状态</a></p>
  </main>
</body>
</html>`;
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
    "Cache-Control": "no-store"
  });
  res.end(html);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("请求体超过 1 MB 限制。");
    chunks.push(chunk);
  }
  const source = Buffer.concat(chunks).toString("utf8");
  if (!source) throw new Error("请求体不能为空。");
  try {
    return JSON.parse(source);
  } catch {
    throw new Error("请求体必须是 JSON。");
  }
}

function validSlug(value) {
  return typeof value === "string" && slugSchema.safeParse(value).success;
}

function handlePreviewRequest(req, res, registry, pathname) {
  const parts = pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  if (parts.length !== 5 || parts[0] !== "projects" || parts[2] !== "previews") return false;
  const [, projectId, , featureSlug, pageSlug] = parts;
  if (!validSlug(projectId) || !validSlug(featureSlug) || !validSlug(pageSlug)) {
    jsonResponse(res, 400, { error: "预览路径不合法。" });
    return true;
  }
  const project = registry.get(projectId);
  if (!project) {
    jsonResponse(res, 404, { error: "未登记的本地项目。" });
    return true;
  }
  const previewPath = path.join(project.root, "outputs", "features", featureSlug, pageSlug, "preview.html");
  if (!fs.existsSync(previewPath) || !fs.statSync(previewPath).isFile()) {
    jsonResponse(res, 404, { error: "预览尚未构建。" });
    return true;
  }
  const content = fs.readFileSync(previewPath);
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": content.length,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(content);
  return true;
}

async function handleMcpRequest(req, res, sessions, registry, getOrigin) {
  const sessionId = sessionHeader(req);
  if (req.method === "GET" && !sessionId && acceptsHtml(req)) {
    browserMcpEndpointResponse(res, getOrigin());
    return;
  }
  if (req.method === "POST") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      jsonRpcError(res, 400, error.message);
      return;
    }

    if (sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        jsonRpcError(res, 404, "未知或已关闭的 MCP 会话。");
        return;
      }
      await session.transport.handleRequest(req, res, body);
      return;
    }

    if (!isInitializeRequest(body)) {
      jsonRpcError(res, 400, "缺少有效的 MCP 会话，请先初始化连接。");
      return;
    }

    let transport;
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        sessions.set(newSessionId, { transport, server: null });
      }
    });
    transport.onclose = () => {
      const closedSessionId = transport.sessionId;
      if (closedSessionId) sessions.delete(closedSessionId);
    };

    const server = createGatewayMcpServer(registry, getOrigin);
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
    if (transport.sessionId) {
      const existing = sessions.get(transport.sessionId);
      if (existing) existing.server = server;
    }
    return;
  }

  if (req.method === "GET" || req.method === "DELETE") {
    if (!sessionId || !sessions.has(sessionId)) {
      jsonRpcError(res, 400, "缺少有效的 MCP 会话。");
      return;
    }
    await sessions.get(sessionId).transport.handleRequest(req, res);
    return;
  }

  res.writeHead(405, { Allow: "GET, POST, DELETE" });
  res.end();
}

function createRequestHandler({ registry, sessions, getOrigin, health }) {
  return async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", getOrigin());
      if (req.method === "GET" && requestUrl.pathname === "/health") {
        jsonResponse(res, 200, health());
        return;
      }
      if (req.method === "GET" && requestUrl.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        res.end("Admin PC Ant local MCP gateway. Connect an MCP client to /mcp.");
        return;
      }
      if (req.method === "GET" && handlePreviewRequest(req, res, registry, requestUrl.pathname)) return;
      if (requestUrl.pathname !== "/mcp") {
        jsonResponse(res, 404, { error: "未找到请求资源。" });
        return;
      }
      await handleMcpRequest(req, res, sessions, registry, getOrigin);
    } catch (error) {
      if (!res.headersSent) {
        jsonRpcError(res, 500, `本地 MCP 网关错误: ${error.message}`);
      }
    }
  };
}

export async function startLocalMcpGateway({ port = DEFAULT_PORT, projectsFile } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("端口必须是 0 到 65535 的整数。");
  }
  const registryFile = projectsFile ? path.resolve(projectsFile) : path.join(frameworkRoot, "mcp", "local-projects.json");
  const registry = loadLocalProjectRegistry(registryFile);
  const sessions = new Map();
  let origin = "";
  const httpServer = http.createServer(createRequestHandler({
    registry,
    sessions,
    getOrigin: () => origin,
    health: () => ({
      status: "ok",
      transport: "streamable-http",
      localOnly: true,
      endpoint: `${origin}/mcp`,
      policyVersion: generationPolicy.policyVersion,
      availableFamilies: generationPolicy.pageFamilies.filter((family) => family.quickEntry).map((family) => family.id),
      projects: [...registry.values()].map(publicProjectStatus)
    })
  }));

  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, LOCAL_HOST, () => {
      httpServer.off("error", reject);
      resolve();
    });
  });
  const address = httpServer.address();
  const activePort = typeof address === "object" && address ? address.port : port;
  origin = `http://${LOCAL_HOST}:${activePort}`;

  return {
    origin,
    endpoint: `${origin}/mcp`,
    registryFile,
    close: async () => {
      await Promise.all([...sessions.values()].map(async ({ transport, server }) => {
        await transport.close();
        await server?.close();
      }));
      sessions.clear();
      await new Promise((resolve, reject) => {
        httpServer.close((error) => error ? reject(error) : resolve());
      });
    }
  };
}

function parseCliArguments(argv) {
  let port = Number(process.env.ADMIN_PROTOTYPE_MCP_PORT || DEFAULT_PORT);
  let projectsFile = process.env.ADMIN_PROTOTYPE_PROJECTS_FILE;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--port") {
      port = Number(argv[index + 1]);
      index += 1;
    } else if (argument === "--projects") {
      projectsFile = argv[index + 1];
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      console.log("Usage: node mcp/admin-prototype-http-gateway.mjs [--port 4318] [--projects /absolute/path/to/local-projects.json]");
      process.exit(0);
    } else {
      throw new Error(`未知参数: ${argument}`);
    }
  }
  return { port, projectsFile };
}

async function main() {
  const gateway = await startLocalMcpGateway(parseCliArguments(process.argv.slice(2)));
  console.log(`Admin PC Ant local MCP gateway is listening at ${gateway.endpoint}`);
  console.log("This service only listens on 127.0.0.1 and is not exposed to the network.");

  const shutdown = async () => {
    await gateway.close();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  main().catch((error) => {
    console.error("admin-pc-ant local MCP gateway failed:", error);
    process.exit(1);
  });
}
