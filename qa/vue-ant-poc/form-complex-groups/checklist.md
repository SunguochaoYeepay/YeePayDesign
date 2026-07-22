# 商户结算配置 交付检查清单

- [x] Page Spec 使用 `admin-pc-ant` / `vue-ant` / renderer v2。
- [x] 表单模板为 `form.grouped-configuration`（分组配置表单）。
- [x] 页面族为 `form`，能力组合：`form.groups`、`form.stickyActions`。
- [x] 固定渲染器从 Page Spec 生成 `#page-content`，未写入页面级脚本或样式。
- [x] 已通过 Vue/Ant Page Spec 契约与内容静态校验。
- [x] 已由固定 Shell 成功构建 `preview.html`。
- [x] 已声明 15 个表单字段和提交状态转场。

## 假设
- 开户银行和适用范围使用有限原型选项，生产环境由业务接口提供。
