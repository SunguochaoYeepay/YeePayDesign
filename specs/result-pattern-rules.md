# 结果页面规则

结果页面使用 `family: result`，表达一次动作、任务或流程的明确处理结论。它通常是来源页面的
当前状态，而不是独立业务菜单或新的 Shell Tab。

## 1. 形态选择

| 业务情形 | 能力 | 内容 |
| --- | --- | --- |
| 单次创建、提交、审核完成 | `result.basic` | 状态图标、标题、说明、主次动作。 |
| 批量处理、资金任务、导入或需说明关键数字 | `result.basic + result.summary` | 基础结果下增加 2 列结构化摘要。 |
| 核心成功流程后的体验调研 | `result.basic + result.feedback` | 可选满意度选择，不阻断后续动作。 |
| 创建、校验或处理失败 | `result.basic` + `status: error` | 明确失败原因和返回修改、重试或返回列表。 |

`result.feedback` 只能用于 `success`，不能用于失败、警告或处理中状态。

## 2. Page Spec 结构

```yaml
page:
  family: result
  presentation: page # 或 inline-state
content:
  capabilities: [result.basic, result.summary]
result:
  source: 分账批量复核流程
  status: success
  title: 复核成功
  description: 稍后即可在转账记录中查看资金到账情况。
  actions:
    primary: { key: continueReview, label: 继续复核 }
    secondary:
      - { key: viewRecords, label: 查看转账记录 }
  summary:
    items:
      - { key: reviewedCount, label: 复核通过, value: 共1笔 }
      - { key: reviewedAmount, label: 复核通过金额, value: 共10.00元 }
```

- 必填：`source`、`status`、`title`、`description` 和至少一个后续动作。
- `status` 只可为 `success`、`error`、`warning`、`processing`。状态图标和颜色由 Ant Result
  统一提供，不能自行以文字符号或 emoji 模拟。
- 普通结果的主操作在左，次操作在右；主操作应该引导最常见下一步。
- `result.summary.items` 为 2 至 6 条，同类数量、金额和处理状态放入同一摘要面，不用重复卡片。
- `result.feedback` 为 3 至 5 个选项，点击仅记录当前原型选择；调研不影响主流程完成。

## 3. 布局与状态

- `presentation: page` 的结果页固定占用完整白色主内容面，不保留灰色页面底或内容区边距；
  结果内容在其中纵向居中，顺序固定为：状态图标、标题、说明、动作、可选摘要、可选调研。
- `presentation: inline-state` 只嵌入其来源内容面，不强制创建独立白色页面。
- `result.summary` 使用克制的浅灰内容面和两列布局，不额外包一层装饰性 Card。
- 失败结果使用错误红，成功使用成功绿；处理完成不把流程 Steps 的 `finish` 色混为成功状态。
- 结果默认不新增菜单或 Shell Tab。只有业务明确要求长期保存的处理报告时，才另建独立详情页。

## 4. 禁止事项

- 禁止生成没有来源和后续动作的孤立结果页。
- 失败结果禁止只展示“失败”，必须有返回修改、重试、下载错误明细或返回列表等恢复动作。
- 简单成功不能强行添加摘要或满意度调研；它们必须由业务价值触发。
- 禁止在结果主体中嵌入查询、表格筛选或复杂编辑表单。
