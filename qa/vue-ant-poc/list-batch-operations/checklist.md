# 列表批量操作验证 交付检查清单

- [x] Page Spec 使用 `admin-pc-ant` / `vue-ant` / renderer v2。
- [x] 页面族为 `list`，能力组合：`query.basic`、`summary.count`、`table.toolbar`、`table.flat`、`table.pagination`、`table.link`、`table.status`、`table.fixedActions`、`table.confirmAction`、`table.selection`、`table.batchActions`、`table.export`、`table.columnSettings`。
- [x] 固定渲染器从 Page Spec 生成 `#page-content`，未写入页面级脚本或样式。
- [x] 已通过 Vue/Ant Page Spec 契约与内容静态校验。
- [x] 已由固定 Shell 成功构建 `preview.html`。
- [x] 已声明 2 个查询字段、22 条原型行数据。

## 假设
- 该 POC 使用 22 条结构化演示数据，验证默认 20 条/页、第二页选择保留和全查询结果选择。
- 批量动作只展示前端反馈；真实启用、失效接口由宿主接入。
