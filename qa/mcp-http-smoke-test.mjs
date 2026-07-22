import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startLocalMcpGateway } from "../mcp/admin-prototype-http-gateway.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "admin-pc-ant-http-mcp-"));
const projectRoot = path.join(tempDirectory, "project");
const projectsFile = path.join(tempDirectory, "local-projects.json");
fs.mkdirSync(projectRoot);
fs.writeFileSync(projectsFile, `${JSON.stringify({
  schemaVersion: 1,
  projects: [{
    id: "smoke-project",
    label: "HTTP MCP 冒烟项目",
    root: projectRoot
  }]
}, null, 2)}\n`);

function resultJson(result) {
  if (result.isError) throw new Error(result.content?.map((item) => item.text || "").join("\n") || "MCP tool failed.");
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("MCP tool did not return text content.");
  return JSON.parse(text);
}

async function call(client, name, args) {
  return resultJson(await client.callTool({ name, arguments: args }));
}

let gateway;
let client;
try {
  gateway = await startLocalMcpGateway({ port: 0, projectsFile });
  const health = await fetch(`${gateway.origin}/health`);
  assert.equal(health.status, 200);
  const healthPayload = await health.json();
  assert.equal(healthPayload.localOnly, true);
  assert.ok(healthPayload.policyVersion);
  assert.ok(healthPayload.availableFamilies.includes("detail"));
  const browserGuide = await fetch(gateway.endpoint, { headers: { Accept: "text/html" } });
  assert.equal(browserGuide.status, 200);
  assert.match(await browserGuide.text(), /本地 MCP 网关已运行/);

  client = new Client({ name: "admin-pc-ant-http-mcp-smoke", version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(gateway.endpoint)));

  const tools = await client.listTools();
  const toolNames = new Set(tools.tools.map((tool) => tool.name));
  [
    "admin_ui_list_projects",
    "admin_ui_inspect_project",
    "admin_ui_initialize_project",
    "admin_ui_get_generation_policy",
    "admin_ui_get_page_contract",
    "admin_ui_write_page_spec",
    "admin_ui_build_page"
  ].forEach((name) => assert.ok(toolNames.has(name), `MCP tool missing: ${name}`));
  const inspectTool = tools.tools.find((tool) => tool.name === "admin_ui_inspect_project");
  assert.ok(inspectTool.inputSchema?.properties?.projectId, "HTTP gateway must accept projectId.");
  assert.equal(inspectTool.inputSchema?.properties?.projectRoot, undefined, "HTTP gateway must not accept projectRoot.");

  const projects = await call(client, "admin_ui_list_projects", {});
  assert.deepEqual(projects.projects.map((project) => project.projectId), ["smoke-project"]);
  assert.equal(projects.projects[0].root, undefined, "Gateway must not expose a filesystem root.");

  const before = await call(client, "admin_ui_inspect_project", { projectId: "smoke-project" });
  assert.equal(before.initialized, false);
  assert.equal(before.activeProjectRoot, undefined, "Gateway must not expose a filesystem root.");

  const initialized = await call(client, "admin_ui_initialize_project", { projectId: "smoke-project" });
  assert.equal(initialized.initialized, true);
  assert.equal(initialized.policySynchronized, true);

  const policy = await call(client, "admin_ui_get_generation_policy", {});
  assert.ok(policy.policyVersion);
  assert.ok(policy.availableFamilies.some((family) => family.id === "detail"));
  assert.ok(policy.validatedCombinations.some((combination) => combination.id === "form.single-stage.side-illustration"));

  const contract = await call(client, "admin_ui_get_page_contract", { projectId: "smoke-project", family: "list" });
  assert.ok(contract.packs?.["context-packs/admin-pc-ant-list.md"]);
  const detailContract = await call(client, "admin_ui_get_page_contract", { projectId: "smoke-project", family: "detail" });
  assert.ok(detailContract.packs?.["context-packs/admin-pc-ant-detail.md"]);
  assert.equal(detailContract.policyVersion, policy.policyVersion);

  const pageSpecYaml = fs.readFileSync(path.join(root, "qa/vue-ant-poc/list-simple-operations/page-spec.yaml"), "utf8");
  const written = await call(client, "admin_ui_write_page_spec", {
    projectId: "smoke-project",
    featureSlug: "mcp-http-smoke",
    pageSlug: "list-simple",
    pageSpecYaml
  });
  assert.equal(written.pageSpec, "outputs/features/mcp-http-smoke/list-simple/page-spec.yaml");
  assert.equal(written.pageSpec.includes(projectRoot), false, "Gateway must not expose a filesystem root.");

  const built = await call(client, "admin_ui_build_page", {
    projectId: "smoke-project",
    featureSlug: "mcp-http-smoke",
    pageSlug: "list-simple"
  });
  assert.equal(built.artifacts.preview, "outputs/features/mcp-http-smoke/list-simple/preview.html");
  assert.equal(built.artifacts.previewUrl, `${gateway.origin}/projects/smoke-project/previews/mcp-http-smoke/list-simple`);
  const preview = await fetch(built.artifacts.previewUrl);
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /老板管账后台原型预览/);

  const detailPageSpecYaml = fs.readFileSync(path.join(root, "qa/vue-ant-poc/detail-drawer-record/page-spec.yaml"), "utf8");
  const detailWritten = await call(client, "admin_ui_write_page_spec", {
    projectId: "smoke-project",
    featureSlug: "mcp-http-smoke",
    pageSlug: "detail-drawer",
    pageSpecYaml: detailPageSpecYaml
  });
  assert.equal(detailWritten.pageSpec, "outputs/features/mcp-http-smoke/detail-drawer/page-spec.yaml");
  const detailBuilt = await call(client, "admin_ui_build_page", {
    projectId: "smoke-project",
    featureSlug: "mcp-http-smoke",
    pageSlug: "detail-drawer"
  });
  assert.equal(detailBuilt.artifacts.preview, "outputs/features/mcp-http-smoke/detail-drawer/preview.html");

  const illustrationPageSpecYaml = fs.readFileSync(path.join(root, "qa/vue-ant-poc/form-single-stage-illustration/page-spec.yaml"), "utf8");
  const illustrationWritten = await call(client, "admin_ui_write_page_spec", {
    projectId: "smoke-project",
    featureSlug: "mcp-http-smoke",
    pageSlug: "form-single-stage-illustration",
    pageSpecYaml: illustrationPageSpecYaml
  });
  assert.equal(illustrationWritten.pageSpec, "outputs/features/mcp-http-smoke/form-single-stage-illustration/page-spec.yaml");
  const illustrationBuilt = await call(client, "admin_ui_build_page", {
    projectId: "smoke-project",
    featureSlug: "mcp-http-smoke",
    pageSlug: "form-single-stage-illustration"
  });
  assert.equal(illustrationBuilt.artifacts.preview, "outputs/features/mcp-http-smoke/form-single-stage-illustration/preview.html");

  const unregistered = await client.callTool({
    name: "admin_ui_inspect_project",
    arguments: { projectId: "not-registered" }
  });
  assert.equal(unregistered.isError, true, "Gateway must reject unregistered projects.");

  console.log("HTTP MCP smoke test passed.");
} finally {
  await client?.close();
  await gateway?.close();
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}
