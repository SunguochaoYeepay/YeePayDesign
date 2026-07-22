import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "admin-pc-ant-mcp-"));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["mcp/admin-prototype-server.mjs"],
  cwd: root,
  stderr: "pipe"
});
const client = new Client({ name: "admin-pc-ant-mcp-smoke", version: "0.1.0" });

function resultJson(result) {
  if (result.isError) throw new Error(result.content?.map((item) => item.text || "").join("\n") || "MCP tool failed.");
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("MCP tool did not return text content.");
  return JSON.parse(text);
}

async function call(name, args) {
  return resultJson(await client.callTool({ name, arguments: args }));
}

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const names = new Set(tools.tools.map((tool) => tool.name));
  [
    "admin_ui_inspect_project",
    "admin_ui_initialize_project",
    "admin_ui_get_generation_policy",
    "admin_ui_get_page_contract",
    "admin_ui_write_page_spec",
    "admin_ui_build_page"
  ].forEach((name) => {
    if (!names.has(name)) throw new Error(`MCP tool missing: ${name}`);
  });

  const before = await call("admin_ui_inspect_project", { projectRoot: tempProject });
  if (before.initialized) throw new Error("Fresh temporary project must not be initialized.");

  const initialized = await call("admin_ui_initialize_project", { projectRoot: tempProject });
  if (!initialized.initialized) throw new Error("MCP initialization did not prepare the temporary project.");
  if (!initialized.policySynchronized) throw new Error("MCP initialization did not synchronize the generation policy.");

  const policy = await call("admin_ui_get_generation_policy", {});
  if (!policy.policyVersion || !policy.availableFamilies?.some((family) => family.id === "detail")) {
    throw new Error("MCP generation policy did not expose detail as an available family.");
  }
  if (!policy.validatedCombinations?.some((combination) => combination.id === "form.single-stage.side-illustration")) {
    throw new Error("MCP generation policy did not expose the single-stage side illustration combination.");
  }

  const contract = await call("admin_ui_get_page_contract", { projectRoot: tempProject, family: "list" });
  if (!contract.packs?.["context-packs/admin-pc-ant-list.md"]) throw new Error("MCP did not return the list Context Pack.");
  const formContract = await call("admin_ui_get_page_contract", { projectRoot: tempProject, family: "form" });
  if (!formContract.packs?.["context-packs/admin-pc-ant-form.md"]) throw new Error("MCP did not return the form Context Pack.");
  const detailContract = await call("admin_ui_get_page_contract", { projectRoot: tempProject, family: "detail" });
  if (!detailContract.packs?.["context-packs/admin-pc-ant-detail.md"]) throw new Error("MCP did not return the detail Context Pack.");
  if (detailContract.policyVersion !== policy.policyVersion) throw new Error("Page contract must report the active policy version.");

  const pageSpecYaml = fs.readFileSync(path.join(root, "qa/vue-ant-poc/list-simple-operations/page-spec.yaml"), "utf8");
  const written = await call("admin_ui_write_page_spec", {
    projectRoot: tempProject,
    featureSlug: "mcp-smoke",
    pageSlug: "list-simple",
    pageSpecYaml
  });
  if (!written.pageSpec || !fs.existsSync(written.pageSpec)) throw new Error("MCP did not write the Page Spec.");

  const built = await call("admin_ui_build_page", {
    projectRoot: tempProject,
    featureSlug: "mcp-smoke",
    pageSlug: "list-simple"
  });
  Object.values(built.artifacts || {}).forEach((artifact) => {
    if (!fs.existsSync(artifact)) throw new Error(`MCP artifact missing: ${artifact}`);
  });

  const formPageSpecYaml = fs.readFileSync(path.join(root, "qa/vue-ant-poc/form-single-stage/page-spec.yaml"), "utf8");
  const formWritten = await call("admin_ui_write_page_spec", {
    projectRoot: tempProject,
    featureSlug: "mcp-smoke",
    pageSlug: "form-single-stage",
    pageSpecYaml: formPageSpecYaml
  });
  if (!formWritten.pageSpec || !fs.existsSync(formWritten.pageSpec)) throw new Error("MCP did not write the explicit-template form Page Spec.");

  const formBuilt = await call("admin_ui_build_page", {
    projectRoot: tempProject,
    featureSlug: "mcp-smoke",
    pageSlug: "form-single-stage"
  });
  Object.values(formBuilt.artifacts || {}).forEach((artifact) => {
    if (!fs.existsSync(artifact)) throw new Error(`MCP form artifact missing: ${artifact}`);
  });

  const illustrationPageSpecYaml = fs.readFileSync(path.join(root, "qa/vue-ant-poc/form-single-stage-illustration/page-spec.yaml"), "utf8");
  const illustrationWritten = await call("admin_ui_write_page_spec", {
    projectRoot: tempProject,
    featureSlug: "mcp-smoke",
    pageSlug: "form-single-stage-illustration",
    pageSpecYaml: illustrationPageSpecYaml
  });
  if (!illustrationWritten.pageSpec || !fs.existsSync(illustrationWritten.pageSpec)) throw new Error("MCP did not write the single-stage illustration Page Spec.");
  const illustrationBuilt = await call("admin_ui_build_page", {
    projectRoot: tempProject,
    featureSlug: "mcp-smoke",
    pageSlug: "form-single-stage-illustration"
  });
  Object.values(illustrationBuilt.artifacts || {}).forEach((artifact) => {
    if (!fs.existsSync(artifact)) throw new Error(`MCP single-stage illustration artifact missing: ${artifact}`);
  });

  const detailPageSpecYaml = fs.readFileSync(path.join(root, "qa/vue-ant-poc/detail-drawer-record/page-spec.yaml"), "utf8");
  const detailWritten = await call("admin_ui_write_page_spec", {
    projectRoot: tempProject,
    featureSlug: "mcp-smoke",
    pageSlug: "detail-drawer",
    pageSpecYaml: detailPageSpecYaml
  });
  if (!detailWritten.pageSpec || !fs.existsSync(detailWritten.pageSpec)) throw new Error("MCP did not write the detail Page Spec.");
  const detailBuilt = await call("admin_ui_build_page", {
    projectRoot: tempProject,
    featureSlug: "mcp-smoke",
    pageSlug: "detail-drawer"
  });
  Object.values(detailBuilt.artifacts || {}).forEach((artifact) => {
    if (!fs.existsSync(artifact)) throw new Error(`MCP detail artifact missing: ${artifact}`);
  });

  const missingTemplateResult = await client.callTool({
    name: "admin_ui_write_page_spec",
    arguments: {
      projectRoot: tempProject,
      featureSlug: "mcp-smoke",
      pageSlug: "form-missing-template",
      pageSpecYaml: formPageSpecYaml.replace(/^template:\n  id: form\.single-stage\n/m, "")
    }
  });
  if (!missingTemplateResult.isError) throw new Error("MCP must reject a new form Page Spec without template.id.");

  console.log("MCP smoke test passed.");
} finally {
  await client.close();
  fs.rmSync(tempProject, { recursive: true, force: true });
}
