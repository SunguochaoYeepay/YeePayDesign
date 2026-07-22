# 父表展开子表验证 交付检查清单

- [x] Page Spec 使用 `admin-pc-ant` / `vue-ant` / renderer v2。
- [x] 页面族为 `list`，能力组合：`query.basic`、`summary.count`、`table.toolbar`、`table.flat`、`table.pagination`、`table.link`、`table.status`、`table.amount`、`table.fixedActions`、`table.confirmAction`、`table.expandable`、`table.export`、`table.refresh`、`table.columnSettings`。
- [x] 固定渲染器从 Page Spec 生成 `#page-content`，未写入页面级脚本或样式。
- [x] 已通过 Vue/Ant Page Spec 契约与内容静态校验。
- [x] 已由固定 Shell 成功构建 `preview.html`。
- [x] 已声明 2 个查询字段、12 条原型行数据。

## 假设
- 该 POC 使用 12 条父行，验证多行同时展开、空子数组不显示展开控件与第二页展开状态保留。
- 子表只承载入账明细展示；真实子数据由分账规则详情接口提供。
