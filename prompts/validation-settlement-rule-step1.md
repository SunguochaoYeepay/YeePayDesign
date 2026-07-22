# 余额分账规则设置：第一步表单验证

请在当前工作目录中完成“余额分账规则设置”第一步表单页验证。

必须先读取：

- `design-system/DESIGN.md`
- `design-system/tokens.css`
- `design-system/components.css`
- `design-system/ANT-PC-COMPONENT-CONTRACT.md`
- `design-system/ANT-PC-ICON-REGISTRY.md`
- `design-system/icon-runtime.js`
- `design-system/icons/ant/sprite.svg`
- `shell/app-shell.html`
- `shell/menu.config.yaml`
- `shell/shell-interactions.js`
- `tools/build-preview.mjs`
- `tools/check-pc-ant-icons.mjs`
- `specs/page-spec-rules.md`
- `specs/content-pattern-catalog.md`
- `specs/form-pattern-rules.md`
- `templates/page-content.template.html`
- `templates/partials/common/states.template.html`
- `templates/partials/form/fields.template.html`
- `templates/partials/form/steps.template.html`
- `templates/partials/form/actions.template.html`
- `templates/partials/form/side-illustration.template.html`
- `templates/primitives/admin-pc-ant/form-controls.template.html`
- `templates/primitives/admin-pc-ant/form-layout.template.html`
- `templates/primitives/admin-pc-ant/steps.template.html`
- `templates/primitives/admin-pc-ant/state.template.html`
- `qa/pc-ant-component-checklist.md`
- `skills/admin-query-flow/SKILL.md`

当前平台固定为 `admin-pc-ant`。本次是页面级表单，不是查询列表、详情页或结果页。

业务位置为：`交易中心 > 余额分账 > 余额分账规则设置`。生成页面只需在 Page Spec 中声明该菜单路径和激活信息，禁止生成或修改菜单 HTML。

生成本页面的第一步“设置分账规则”：

- Page Spec 必须声明 `family: form`、`presentation: page`、`ui.platform: admin-pc-ant`、`ui.runtime: vue-ant`、`rendererVersion: 2`、`capabilities: [form.steps, form.sideIllustration]`、`form.fieldLayout: single-column` 和 `form.actions.placement: control-start`。本页不得使用 `form.stickyActions`。
- 显示三步 Steps：`1 设置分账规则` 为 `process`，`2 设置入账规则` 和 `3 确认并完成设置` 均为 `wait`。不得将当前第一步标记为 `finish`，不得使用成功绿色。
- 账户类别 `accountCategory` 固定展示“银行卡”，不可编辑。
- 结算方式 `settlementChangeType` 为必填 RadioGroup：`仅变更卡号`、`变更结算人`；默认选中“变更结算人”。选中态使用主色。切换时清空下方可编辑字段，并在 Page Spec 声明条件校验规则。
- `bankAccountType` 为必填 Select：借记卡、存折；由固定 Vue/Ant 运行时渲染，不得输出原生 Select 或页面级组件代码。
- `legalPersonCard` 为必填 Select，默认显示“请选择”。
- `accountName` 为必填输入框，placeholder 为“请输入账户名称”。
- `bankBranch` 为选填 Select，默认显示“请选择银行账户开户行”。
- `bankAccountNumber` 为必填输入框，placeholder 为“请输入银行账户号码”。
- 按钮名称“提交”，默认禁用。Page Spec 中声明：全部必填项通过前端基础校验后可点击；后端四要素实名校验成功后进入第二步，失败保留已填内容并提示错误。

页面布局规则：

- 仅生成 `#page-content` 内的业务内容，不得输出 Shell、菜单、TopBar、Tabs、页脚、`body`、`head` 或完整 HTML。
- 使用 `form.sideIllustration`：顶部横向 Steps；下方左侧为单列字段堆栈和提交按钮，右侧为“自动分账规则”产品服务图片形态占位、标题与两行内说明。由固定 Vue/Ant 运行时渲染，字段区不得拆成两列，不得出现窄列、竖排文本或把说明挤入 label。
- Page Spec 为插图声明 `assetKey: settlement-rule-service`、`purpose: 产品服务说明`、`theme: 自动分账与资金划转`、`assetStatus: placeholder`。页面保留右侧插图区域；尚未生成真实资产时使用统一占位，不能以无关图片替代。
- 页面只能显示短 label、placeholder 和必要的一行内 helperText。实名匹配、数据源、银行卡位数、四要素校验等完整规则必须写入 Page Spec 的 `validation`、`rules`、`assumptions`，不能直接渲染到字段网格中。
- 不得生成页面级 Vue、JavaScript、CSS、HTML 控件或 Shell；Page Spec 只声明业务字段和行为，控件与图标由固定运行时渲染。
- 在 `content.states` 中声明 `loading`、`error`；默认页面不得预先显示它们。

请写入：

- `outputs/validation/pc-ant-settlement-rule-step1/page-spec.yaml`
- `outputs/validation/pc-ant-settlement-rule-step1/page-content.html`
- `outputs/validation/pc-ant-settlement-rule-step1/checklist.md`

然后必须从当前项目根目录执行：

```bash
node tools/build-vue-ant-page.mjs \
  outputs/validation/pc-ant-settlement-rule-step1/page-spec.yaml \
  outputs/validation/pc-ant-settlement-rule-step1/page-content.html \
  outputs/validation/pc-ant-settlement-rule-step1/checklist.md \
  outputs/validation/pc-ant-settlement-rule-step1/preview.html
```

最终只汇报四个产物路径：

- `page-spec.yaml`
- `page-content.html`
- `checklist.md`
- `preview.html`

不要在对话中粘贴完整 HTML。
