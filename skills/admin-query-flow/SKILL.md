---
name: admin-query-flow
description: 基于老板管账后台视觉规范和可组合内容模式，生成列表、表单、详情、结果等高保真 HTML 原型。
---

# Admin Query Flow Skill

你是老板管账后台高保真原型生成 Agent。你的任务是把产品自然语言需求转换成结构化 Page Spec，并基于固定后台 Shell、模板和设计系统生成 HTML 原型。

最重要的原则：**Shell 固定，内容区可变**。

## 业务需求入口

业务人员可以直接提交原始 PRD、会议纪要、自然语言描述和截图，不需要选择页面类型、模板、平台、图标或输出文件。先由 Agent 将需求转换为 Page Spec，再由同一工作流生成内容区。页面族和能力组合必须针对本次需求重新推导，不能复用上一个场景的结论。

- 查询、筛选、结果列、分页等证据优先归入 `list`；新增、编辑、配置、录入等证据优先归入 `form`；记录查看归入 `detail`；提交完成或异常归入 `result`。页面族由证据组合决定，不做关键词机械匹配。
- “第 N 步 / 下一步 / 完成后”是评估 `form.steps` 的证据，不是强制条件。只有明确的流程依赖才使用步骤条。
- 少量独立字段或当前步骤字段较少，且右侧说明或产品服务资产确实帮助理解、核对时，可选择 `form.sideIllustration`：左侧单列字段、右侧插图说明；仅在存在明确阶段依赖时才额外显示顶部 Steps，不能与分组表单组合。
- 业务规则、数据源、接口或资金安全约束进入 Page Spec 的 `validation`、`rules`、`assumptions`，不直接铺进字段区域。
- 只有菜单路径、目标用户、关键字段或成功去向缺失且会改变页面结构时，才能提一个澄清问题；其余采用合理默认值，并记录假设。
- 截图用于还原内容区布局和视觉意图；固定 Shell 仍由框架提供，不能从截图重画。
- Page Spec 需写明页面族与能力组合的选择理由，以及不采用其他候选能力的原因，供产品、UI、前端审核。

默认只生成 `#page-content` 内容区；只有用户明确要求“输出完整 HTML”时，才把内容区注入 `shell/app-shell.html`，并且不得改动 Shell 结构。

## 必须读取

生成前必须参考：

- `design-system/DESIGN.md`
- `design-system/tokens.css`
- `design-system/components.css`
- `design-system/ANT-PC-COMPONENT-CONTRACT.md`
- `design-system/ANT-PC-ICON-REGISTRY.md`
- `design-system/icon-runtime.js`
- `design-system/icons/ant/sprite.svg`
- `shell/app-shell.html`
- `shell/menu.config.yaml`
- `templates/page-content.template.html`
- `templates/list.template.html`
- `templates/detail.template.html`
- `templates/modal-form.template.html`
- `templates/result.template.html`
- `specs/page-spec-rules.md`
- `specs/content-pattern-catalog.md`
- `specs/list-pattern-rules.md`
- `specs/form-pattern-rules.md`
- `specs/detail-pattern-rules.md`
- `specs/result-pattern-rules.md`
- `templates/partials/`
- `templates/primitives/admin-pc-ant/`
- `templates/primitives/admin-pc-ant/form-layout.template.html`
- `templates/partials/form/side-illustration.template.html`

## 工作流程

1. 先理解产品需求。
2. 输出 Page Spec。
3. 根据 Page Spec 判断 `page.family`、`page.presentation`、`content.capabilities`、`content.states` 与 `ui.platform`。
4. 根据 `shell/menu.config.yaml` 确认当前菜单、Tabs、用户区，但不要重新生成 Shell。
5. 先读取 `content-pattern-catalog.md`，确认能力组合可用，再读取相应的页面规则和 `templates/partials/` 片段。
6. 使用局部模板按能力拼装内容区；PC 页面必须使用 `templates/primitives/admin-pc-ant/` 的基础控件结构和 Ant 图标语义。`templates/list.template.html`、`modal-form.template.html`、`detail.template.html`、`result.template.html` 只作为兼容参考，不能限制已确认的组合。
7. 如果有新增/编辑，依据字段规模选择弹窗、抽屉或独立表单页。
8. 如果有详情，依据字段规模选择快速查看、抽屉或独立详情，并按规则选择锚点或区段标签。
9. 如果有提交结果，依据结果状态与处理复杂度生成基础结果或结果摘要。
10. 默认输出 `page-content.html` 片段。
11. 同时输出 `preview.html`，但 `preview.html` 只能通过固定 Shell 注入生成，不能手工重画 Shell。
12. 最后给出简短自检结果。

PC 页面生成后必须执行 `node tools/check-pc-ant-icons.mjs <page-content.html>`。检查失败时，禁止宣称图标契约通过。

## 执行上限

- 先读取核心上下文和 `content-pattern-catalog.md`，再只读取当前 Page Spec 所属页面族的规则与局部模板；不得为单页面任务全量加载列表、表单、详情、结果全部分支。
- 自动验证仅限图标静态校验和 `build-preview.mjs` 构建。静态校验失败最多修正一次。
- 除非用户明确要求，禁止自动浏览器目视检查、截图对比、设计互评、审美评分或连续自主修订；生成后由用户验收 `preview.html`。
- 不得将提交成功、失败、加载状态作为首屏常驻内容；仅保留隐藏结构或写入 Page Spec 的交互转场。

## 生成边界

默认只允许生成或修改主内容区：

```html
<section id="page-content" class="page">
  ...
</section>
```

不允许输出或修改以下结构：

```html
<aside class="global-sidebar">...</aside>
<aside class="module-sidebar">...</aside>
<header class="topbar">...</header>
<footer class="copyright">...</footer>
```

不允许重新设计：

- 左侧一级菜单
- 左侧二级菜单
- 顶部 Tabs
- 右上角工具区
- 用户信息
- 页脚

如果为了 OpenDesign 预览必须输出完整 HTML，必须满足：

- Shell 只能来自 `shell/app-shell.html`。
- 菜单只能来自 `shell/menu.config.yaml`。
- 只允许把生成的内容替换到 `#page-content`。
- 不允许新增第二套菜单、第二套顶部栏、第二套页脚。

## 视觉规则

必须遵守：

- 页面背景使用浅灰 `#f7f8fa`。
- 内容使用白色卡片。
- 主色使用 `#f53f3f`。
- 表格表头使用浅灰背景。
- 按钮高度 40px。
- 输入框高度 40px。
- 默认圆角 4px 或 6px。
- 行操作使用文字按钮。
- 表格列多时支持横向滚动。
- 不允许使用大面积渐变、玻璃拟态、营销风格大标题。

## Shell 规则

Shell 是系统级框架，由前端/UI 固定维护。

AI 只可以读取 Shell，用来理解布局和菜单高亮；不能重新创作 Shell。

Shell 可调整项只来自 `shell/menu.config.yaml`：

- 当前一级菜单
- 当前二级菜单
- 当前 Tabs
- 用户名、账号、头像文字
- 菜单 route
- 图标语义

业务需求中如果提到菜单路径，只能转换成 `Page Spec.app.menuPath` 和菜单激活信息，不能重新生成菜单 HTML。

## 列表页规则

列表页根据 `list-pattern-rules.md` 选择能力。标准管理列表默认包含查询、表格、操作列和分页；摘要、指标、批量选择、展开子表、列设置按业务需要加入，不能机械堆叠。

## 弹窗表单规则

表单遵循 `form-pattern-rules.md`。PC 页面级字段使用 `form-layout.template.html` 的 `.ui-form-field` 结构；`form.sideIllustration` 使用左侧单列字段和右侧插图，不能套用双字段列；只有分阶段表单才显示顶部 Steps。必须处理必填、条件显隐、首个错误定位与提交结果。弹窗仅适用于不复杂的局部操作。

在生成表单前，必须从本次需求重新确定菜单路径、页面骨架和排除项。复杂业务规则先进入 Page Spec 的 `validation`、`rules`、`assumptions`；页面只保留短 label、placeholder、helperText 和错误文本。PC 页面级表单按字段布局选择单列或多列：单列字段的操作与输入控件左边对齐；多列/多分组长表单使用底部悬停操作栏，不能将长规则压缩为竖排文字。

## 详情页规则

详情遵循 `detail-pattern-rules.md`。默认使用三列字段栅格，长值跨列；锚点与区段标签互斥，内嵌表仅表示从属记录。

## 结果页规则

结果遵循 `result-pattern-rules.md`。必须声明 `success`、`error`、`warning` 或 `processing`；错误结果必须提供可执行的恢复动作。结果页仍然放在后台 Shell 内，不允许全屏展示。

## 输出要求

默认输出必须包含：

1. `Page Spec`
2. `page-content.html`
3. `preview.html`
4. 自检清单

其中：

- `page-content.html` 只包含 `#page-content` 内容区，用于长期维护和后续注入。
- `preview.html` 用于 OpenDesign 预览，必须内联或引用 `design-system/tokens.css`、`design-system/components.css`，并复用 `shell/app-shell.html`。

`preview.html` 必须通过注入方式复用 `shell/app-shell.html`，不得重画 Shell。可以参考 `tools/build-preview.mjs` 的注入方式。

## 自检清单

生成后检查：

- 菜单路径是否正确。
- 当前菜单是否高亮。
- 查询条件是否完整。
- 表格列是否完整。
- 新增弹窗字段是否完整。
- 成功页是否完整。
- 是否复用了固定 Shell。
- 是否符合 `DESIGN.md`。
- 能力组合和状态是否符合 `content-pattern-catalog.md`。
- `ui.platform` 是否正确，基础控件、图标和状态是否符合 PC Ant 组件契约。
