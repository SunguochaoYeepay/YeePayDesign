# 列表与简单操作验证 交付检查清单

- [x] Page Spec 使用 `admin-pc-ant` / `vue-ant` / renderer v2。
- [x] 页面族为 `list`，能力组合：`query.basic`、`table.toolbar`、`table.flat`、`table.pagination`、`table.link`、`table.status`、`table.fixedActions`、`table.confirmAction`。
- [x] 固定渲染器从 Page Spec 生成 `#page-content`，未写入页面级脚本或样式。
- [x] 已通过 Vue/Ant Page Spec 契约与内容静态校验。
- [x] 已由固定 Shell 成功构建 `preview.html`。
- [x] 已声明 3 个查询字段、8 条原型行数据。

## 假设
- 简单列表只验证最小查询与单行操作，不包含统计卡、批量选择、展开子表或高级筛选。
