# 结果页面规则

结果页面使用 `family: result`，它是业务动作的闭环状态，不是独立的业务菜单。

## 必填字段

- `status`：`success`、`error`、`warning` 或 `processing`。
- `title` 与 `description`。
- 至少一个后续动作，或明确的自动跳转规则。
- `source`：来源动作或来源页面。

## 判断规则

- 单一提交成功：`result.basic`。
- 批量处理、导入或需解释原因：增加 `result.summary`。
- 处理失败：提供返回修改、重试或下载错误明细。
- 成功完成一次流程时，可选 `result.feedback`。

## 模板映射

| Page Spec 能力 | 局部模板 |
| --- | --- |
| `result.basic` | `templates/partials/result/result.template.html` |
| `result.summary` | `templates/partials/result/summary.template.html` |

## 禁止事项

- 结果默认不创建菜单和 Shell 标签。
- 不生成没有入口或后续动作的孤立成功页。
