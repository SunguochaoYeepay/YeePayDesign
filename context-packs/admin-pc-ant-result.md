# Admin PC Ant Result Context Pack

状态：**待人工验收**。本包仅用于结果 POC 与框架验收；在 `context-packs/index.md` 标记为
“可用”前，快速业务入口不得为真实业务页面选择 `result`。

依赖：先读取 `admin-pc-ant-core.md`。适用 `family: result` 的成功、失败、警告和处理中
反馈。业务 Agent 只写 Page Spec，固定 Vue / Ant 运行层渲染 Ant `Result`、按钮、摘要与
可选满意度选择。

## 能力选择

| 业务证据 | 能力 | 约束 |
| --- | --- | --- |
| 单一动作完成或失败 | `result.basic` | 所有结果必选。 |
| 批量、导入、资金或需要核对关键数字 | `result.summary` | 2 至 6 条结构化摘要。 |
| 核心成功流程后的体验调研 | `result.feedback` | 仅 `success`，3 至 5 个选项，不阻断流程。 |

## 规格契约

```yaml
page:
  family: result
  presentation: page # 或 inline-state
ui:
  platform: admin-pc-ant
  runtime: vue-ant
  rendererVersion: 2
content:
  capabilities: [result.basic]
result:
  source: 来源流程或动作
  status: success # success | error | warning | processing
  title: 处理成功
  description: 已完成本次处理。
  actions:
    primary: { key: returnList, label: 返回列表 }
```

- `source`、`status`、`title`、`description` 和至少一个 action 必填。
- 错误结果必须带恢复动作，例如返回修改、重试、下载错误明细或返回列表。
- `result.summary` 使用 `result.summary.items`；不可用它替代列表或详情页。
- `result.feedback` 必须有 `prompt` 和 3 至 5 个 `{ key, label }` 选项。

## 布局与边界

- `presentation: page` 使用完整白色主内容面，不露出灰色页面底或额外内容区边距；内容在其中垂直居中，
  顺序为状态图标、标题、说明、动作、可选摘要、可选调研。`inline-state` 继承来源内容面。
- 成功、失败、警告、处理中使用 Ant Result 的语义状态，不自制 SVG、emoji 或文字图标。
- 结果默认是来源流程的状态，不生成菜单和 Shell Tab；长期保存的报告另建 `detail` 页面。
- 不在结果页嵌入筛选、管理列表或编辑表单。
