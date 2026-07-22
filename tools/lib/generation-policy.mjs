import fs from "node:fs";
import path from "node:path";

export const policyRelativePath = "context-packs/admin-pc-ant-policy.json";

function assertPolicy(condition, message) {
  if (!condition) throw new Error(`Invalid Admin PC Ant generation policy: ${message}`);
}

export function loadGenerationPolicy(projectRoot) {
  const source = fs.readFileSync(path.join(projectRoot, policyRelativePath), "utf8");
  const policy = JSON.parse(source);
  assertPolicy(policy?.schemaVersion === 1, "schemaVersion must be 1.");
  assertPolicy(typeof policy.policyVersion === "string" && policy.policyVersion.length > 0, "policyVersion is required.");
  assertPolicy(Array.isArray(policy.pageFamilies) && policy.pageFamilies.length > 0, "pageFamilies are required.");

  const ids = new Set();
  for (const family of policy.pageFamilies) {
    assertPolicy(typeof family?.id === "string" && /^[a-z][a-z-]*$/.test(family.id), "each family requires a lowercase id.");
    assertPolicy(!ids.has(family.id), `duplicate family id: ${family.id}.`);
    ids.add(family.id);
    assertPolicy(typeof family.evidence === "string" && family.evidence.length > 0, `${family.id} requires evidence.`);
    assertPolicy(typeof family.contextPack === "string" && family.contextPack.endsWith(".md"), `${family.id} requires a Context Pack.`);
    assertPolicy(["available", "workflow-only", "pending"].includes(family.availability), `${family.id} has an invalid availability.`);
    assertPolicy(typeof family.quickEntry === "boolean", `${family.id} requires quickEntry.`);
    assertPolicy(family.quickEntry === (family.availability === "available"), `${family.id} quickEntry must match availability.`);
  }
  assertPolicy(Array.isArray(policy.validatedCombinations), "validatedCombinations must be an array.");
  const combinationIds = new Set();
  for (const combination of policy.validatedCombinations) {
    assertPolicy(typeof combination?.id === "string" && combination.id.length > 0, "each validated combination requires an id.");
    assertPolicy(!combinationIds.has(combination.id), `duplicate combination id: ${combination.id}.`);
    combinationIds.add(combination.id);
    assertPolicy(findFamily(policy, combination.family)?.quickEntry, `${combination.id} must reference an available family.`);
    assertPolicy(typeof combination.templateId === "string" && combination.templateId.length > 0, `${combination.id} requires a templateId.`);
    assertPolicy(Array.isArray(combination.capabilities) && combination.capabilities.length > 0, `${combination.id} requires capabilities.`);
    assertPolicy(combination.availability === "available", `${combination.id} must be available.`);
    assertPolicy(typeof combination.description === "string" && combination.description.length > 0, `${combination.id} requires a description.`);
  }
  return policy;
}

export function availableFamilies(policy) {
  return policy.pageFamilies.filter((family) => family.quickEntry);
}

export function findFamily(policy, familyId) {
  return policy.pageFamilies.find((family) => family.id === familyId) || null;
}

export function renderPolicyIndex(policy) {
  const rows = policy.pageFamilies.map((family) => {
    const status = family.availability === "available" ? "可用" : family.availability === "workflow-only" ? "仅流程转场" : "待人工验收";
    return `| ${family.evidence} | \`${family.id}\` | \`${family.contextPack}\` | ${status} |`;
  }).join("\n");

  return `# 页面族路由索引\n\n本文件由 \`admin-pc-ant-policy.json\` 生成。页面族支持范围以 MCP 返回的实时策略为唯一依据；\n不得依据项目提示、旧对话或客户端缓存判断是否支持。\n\n| 业务证据 | 主页面族 | 读取包 | 当前状态 |\n| --- | --- | --- | --- |\n${rows}\n\n选择规则：\n\n- 当前只生成一个内容区时，只读取一个主页面族包。\n- 提交后跳转下一步或显示异步校验，不等于当前页面要改为 \`result\`；它应是当前 Page Spec 的交互转场。\n- 多步骤只在前后依赖明确时使用。\n- 右侧说明或配图只在能帮助当前任务理解时使用，不是默认装饰。\n- Page Spec 必须记录选择理由、未采用的候选能力和必要假设。\n- 只有实时策略标记为“可用”的页面族可以走快速入口；其他页面族不能为了继续任务回退到全量读取原始资料。\n`;
}
