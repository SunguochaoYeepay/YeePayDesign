import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  availableFamilies,
  loadGenerationPolicy,
  renderPolicyIndex
} from "../tools/lib/generation-policy.mjs";
import { inspectProject } from "../mcp/admin-prototype-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = loadGenerationPolicy(root);
const index = fs.readFileSync(path.join(root, "context-packs", "index.md"), "utf8");
const target = fs.mkdtempSync(path.join(os.tmpdir(), "admin-pc-ant-policy-"));

try {
  assert.equal(index, renderPolicyIndex(policy), "Routing index must be generated from the policy manifest.");
  assert.deepEqual(availableFamilies(policy).map((family) => family.id), ["list", "form", "detail"]);

  fs.writeFileSync(path.join(target, "AGENTS.md"), "# 自定义项目说明\n\n保留这段内容。\n");
  const initialized = spawnSync(process.execPath, ["tools/prepare-opendesign-project.mjs", target], { cwd: root, encoding: "utf8" });
  assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);

  const marker = JSON.parse(fs.readFileSync(path.join(target, ".opendesign-framework.json"), "utf8"));
  assert.equal(marker.policyVersion, policy.policyVersion, "Initialization must record the active policy version.");
  const agents = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");
  assert.match(agents, /保留这段内容。/, "Initialization must preserve project-owned instructions.");
  assert.match(agents, /admin-pc-ant-policy:begin/, "Initialization must write the managed policy instruction block.");
  assert.match(agents, /admin_ui_get_generation_policy/, "Managed instructions must require the live policy tool.");
  assert.doesNotMatch(agents, /当前支持 `form`、`list`/, "Managed instructions must not hard-code page family availability.");

  marker.policyVersion = "outdated-policy";
  fs.writeFileSync(path.join(target, ".opendesign-framework.json"), `${JSON.stringify(marker, null, 2)}\n`);
  const stale = inspectProject(target);
  assert.equal(stale.initialized, false, "A project with an outdated policy marker must not remain initialized.");
  assert.equal(stale.policySynchronized, false, "Project inspection must report an outdated policy marker.");

  console.log("Generation policy consistency checks passed.");
} finally {
  fs.rmSync(target, { recursive: true, force: true });
}
