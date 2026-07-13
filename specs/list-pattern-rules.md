# 列表页面规则

列表页面使用 `family: list`。具体能力与组合以 `content-pattern-catalog.md` 为准，本文件给出生成顺序和字段约束。

## 生成顺序

1. 选择 `query.basic` 或 `query.advanced`。
2. 选择一个表格主体：`table.flat` 或 `table.expandable`。
3. 按需增加摘要、工具栏、列能力、选择和分页。
4. 为加载、无数据、错误和选择态提供结构。

## 字段约束

- `query.fields` 中每个字段必须有 `key`、`label`、`control`。
- 表格必须有稳定 `rowKey`、`columns` 和至少一个可识别的行操作或主操作。
- 金额必须声明 `format: currency` 与币种；日期使用 `date` 或 `datetime`；状态使用 `status`。
- 可能超长的值使用 `ellipsis: true` 与完整值提示，不缩小表格字体。
- 批量选择必须声明 `batchActions`；危险动作必须声明 `confirm`。

## 模板映射

| Page Spec 能力 | 局部模板 |
| --- | --- |
| `query.basic` / `query.advanced` | `templates/partials/list/query.template.html` |
| `summary.count` / `summary.metrics` | `templates/partials/list/summary.template.html` |
| `table.toolbar` | `templates/partials/list/toolbar.template.html` |
| `table.flat` / `table.expandable` | `templates/partials/list/table.template.html` |
| `table.selection` | `templates/partials/list/selection-toolbar.template.html` |
| 状态 | `templates/partials/common/states.template.html` |

## 禁止事项

- 不把创建/编辑复杂表单直接塞在列表主体中；使用弹窗、抽屉或独立表单页。
- 不用子表承载可独立查询、筛选、批量处理的数据。
- 不为无批量动作的列表生成选择列。
