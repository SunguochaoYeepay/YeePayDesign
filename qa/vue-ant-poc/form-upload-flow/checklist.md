# 分账规则批量导入 交付检查清单

- [x] Page Spec 使用 `admin-pc-ant` / `vue-ant` / renderer v2。
- [x] 表单模板为 `form.import-review-flow`（导入复核流程表单）。
- [x] 页面族为 `form`，能力组合：`form.steps`、`form.modeTabs`、`form.upload`、`form.reviewTable`、`form.uploadFlow`、`form.stickyActions`。
- [x] 固定渲染器从 Page Spec 生成 `#page-content`，未写入页面级脚本或样式。
- [x] 已通过 Vue/Ant Page Spec 契约与内容静态校验。
- [x] 已由固定 Shell 成功构建 `preview.html`。
- [x] 已声明 3 个表单字段和提交状态转场。

## 假设
- 原型使用本地文件选择与固定解析结果，真实文件校验和导入由后端接口完成。
