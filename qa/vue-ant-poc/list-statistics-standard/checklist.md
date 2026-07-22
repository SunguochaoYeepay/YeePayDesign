# 列表统计卡片（标准）验证 交付检查清单

- [x] Page Spec 使用 `admin-pc-ant` / `vue-ant` / renderer v2。
- [x] 页面族为 `list`，能力组合：`query.basic`、`statistics.cards`、`table.toolbar`、`table.flat`、`table.pagination`、`table.link`、`table.tags`、`table.status`、`table.amount`、`table.fixedActions`、`table.confirmAction`、`table.export`、`table.columnSettings`。
- [x] 固定渲染器从 Page Spec 生成 `#page-content`，未写入页面级脚本或样式。
- [x] 已通过 Vue/Ant Page Spec 契约与内容静态校验。
- [x] 已由固定 Shell 成功构建 `preview.html`。
- [x] 已声明 3 个查询字段、8 条原型行数据。

## 假设
- 五张统计卡均基于当前已应用查询的演示行聚合；点击查询后会同步更新。
- 标准统计卡不带补充说明或文本动作，避免与富统计卡混用。
