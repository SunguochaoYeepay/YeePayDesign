# 列表统计卡片（富卡片）验证 交付检查清单

- [x] Page Spec 使用 `admin-pc-ant` / `vue-ant` / renderer v2。
- [x] 页面族为 `list`，能力组合：`query.basic`、`statistics.cards`、`statistics.cards.rich`、`table.toolbar`、`table.flat`、`table.pagination`、`table.link`、`table.tags`、`table.status`、`table.fixedActions`、`table.confirmAction`、`table.export`、`table.columnSettings`。
- [x] 固定渲染器从 Page Spec 生成 `#page-content`，未写入页面级脚本或样式。
- [x] 已通过 Vue/Ant Page Spec 契约与内容静态校验。
- [x] 已由固定 Shell 成功构建 `preview.html`。
- [x] 已声明 3 个查询字段、8 条原型行数据。

## 假设
- 三张统计卡的主数值随当前已应用查询的演示行聚合更新。
- 卡片底部的笔数、待结算和欠费文本用于验证富卡片布局；真实业务由统计接口返回。
