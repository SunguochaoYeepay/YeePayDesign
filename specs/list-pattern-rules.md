# 列表页面规则

列表页面使用 `family: list`。具体能力与组合以 `content-pattern-catalog.md` 为准，本文件给出生成顺序和字段约束。

## 生成顺序

1. 选择 `query.basic` 或 `query.advanced`。
2. 选择一个表格主体：`table.flat` 或 `table.expandable`。
3. 按需增加摘要、工具栏、列能力、选择和分页。
4. 为加载、无数据、错误和选择态提供结构。

## 模板分类

列表模板只按交互复杂度分类，不以某个业务页面名称命名：

| 分类 | 基础能力 | 不包含 |
| --- | --- | --- |
| 列表 + 简单操作 | `query.basic + table.flat + table.pagination + table.fixedActions` | 高级筛选、统计卡、批量选择、子表。 |
| 列表复杂用法 | `query.advanced`，可组合日期范围、快捷日期、语义列、工具栏和列设置 | 批量选择和子表。 |
| 列表 + 统计 | 在简单或复杂列表上增加 `statistics.cards`；`standard` 与 `rich` 是同类变体 | 批量选择和子表。 |
| 列表 + 批量操作 | `table.selection + table.batchActions`，可配基础查询与工具栏 | 子表。 |
| 列表 + 子表格 | `table.expandable`，父行展开只读从属表 | 批量选择和嵌套展开。 |

业务场景页，例如“分账规则管理”，只能作为 `qa/business-regression/` 回归样例，不得作为
模板分类或 Context Pack 的选择名称。

## 字段约束

- `query.fields` 中每个字段必须有 `key`、`label`、`control`。
- 表格必须有稳定 `rowKey`、`columns` 和至少一个可识别的行操作或主操作。
- 金额必须声明 `format: currency` 与币种；日期使用 `date` 或 `datetime`；状态使用 `status`。
- 可能超长的值使用 `ellipsis: true` 与完整值提示，不缩小表格字体。
- 批量选择必须声明 `batchActions`；危险动作必须声明 `confirm`。

## 查询操作布局

- `收起/展开`（如有）、`重置`、`查询`是一个查询操作组，必须作为查询网格的最后一个
  单元格渲染，不能在网格外另起固定操作行。
- 操作组固定占当前网格最右列，并随查询条件的实际占格自动落入最后一行：条件未填满当前
  行时与该行右侧对齐；条件正好填满一行时，在下一行最右侧对齐。此规则按每一行重复，
  `span` 字段按其实际占用列数计算。
- 操作组只在没有可用的最右列时才形成视觉上的独立行；它仍须保持右对齐，不能左对齐或
  始终预留整行。

## 快捷日期布局

- 没有 `query.quickRanges` 时，`date-range` 是普通查询字段，按声明顺序和 `span` 参与
  条件布局。
- 声明 `query.quickRanges` 时，它只能绑定唯一一个 `date-range`。日期范围与“今日/昨日/
  近 3 日”等快捷项组成一个时间条件组，快捷项必须横向紧跟日期范围，不得垂直堆在日期控件
  下方。
- 含快捷日期的时间条件组独占一个查询行；其他条件从下一行开始。业务 Agent 只声明
  `quickRanges` 和字段顺序，不通过手写 `span: 3` 或空白字段模拟该布局。
- 时间条件组遵循 `query.fields` 的声明顺序；采用该推荐样式时，应将其声明为首个查询字段，
  不能由运行层擅自重排业务字段。

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
