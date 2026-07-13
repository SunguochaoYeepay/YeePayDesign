# 详情页面规则

详情页面使用 `family: detail`。它用于阅读和有限操作，不能承担完整的管理列表职责。

## 判断规则

- 少量字段快速核对：`detail.quickView`，默认弹窗或抽屉。
- 信息量大、分组多：独立 `page`。
- 紧密连续的信息组：`detail.anchors`。
- 相对独立且可单独操作的信息组：`detail.sectionTabs`。

## 字段与布局约束

- 默认三列 `detail.groups`；长内容可设置 `span: 2` 或 `span: full`。
- 每个信息组都必须有清晰标题；字段标签和值左对齐，不拆成字段小卡片。
- `detail.embeddedTable` 只表现关联明细、操作日志等从属记录。
- `detail.metrics` 不超过 5 个，且不能取代基础信息。
- `detail.anchors` 与 `detail.sectionTabs` 互斥。

## 模板映射

| Page Spec 能力 | 局部模板 |
| --- | --- |
| `detail.groups` / `detail.quickView` | `templates/partials/detail/groups.template.html` |
| `detail.anchors` / `detail.sectionTabs` | `templates/partials/detail/navigation.template.html` |
| `detail.embeddedTable` | `templates/partials/detail/embedded-table.template.html` |
