# 表单页面规则

表单页面使用 `family: form`。根据字段规模和业务流程选择简单、分组、分步或导入能力。

## 判断规则

- 少量独立字段：`form.simple`。
- 多个并列信息组：`form.groups`。
- 有明确先后依赖：`form.steps`。
- 导入流程：`form.upload` + `form.confirm` + `form.resultTransition`。
- 长表单、多步骤、批处理：增加 `form.stickyActions`。
- 需要辅助说明时，可增加 `form.illustration`；先使用统一占位，后续由 OpenDesign 生成真实插图。

## 字段约束

- 每个字段必须有 `key`、`label`、`control`；必填字段声明 `required: true`。
- 条件显示字段必须声明 `visibleWhen`，禁用字段必须声明 `disabledWhen`。
- 编辑场景应声明 `initialData` 来源和 `leaveConfirm`。
- 提交动作必须声明 `successTarget`；失败场景必须能回到可修改状态。
- 配图必须声明 `assetKey`、`purpose`、`theme`；未生成真实资产时使用 `assetStatus: placeholder`。

## 模板映射

| Page Spec 能力 | 局部模板 |
| --- | --- |
| `form.simple` / `form.groups` | `templates/partials/form/fields.template.html` |
| `form.steps` | `templates/partials/form/steps.template.html` |
| `form.upload` | `templates/partials/form/upload.template.html` |
| `form.stickyActions` | `templates/partials/form/actions.template.html` |
| `form.confirm` | `templates/partials/form/confirm.template.html` |
| `form.illustration` | `templates/partials/form/illustration.template.html` |

## 禁止事项

- 字段多不能直接推导为步骤表单。
- 简短弹窗表单不使用粘性操作栏。
- 表单校验失败后不得只显示全局错误，必须定位到首个错误字段。
