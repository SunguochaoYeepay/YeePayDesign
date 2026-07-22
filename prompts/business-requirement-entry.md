# 业务需求入口

以下内容是业务需求，不是开发任务清单。请先作为“需求理解 Agent”解析，再作为“原型实施 Agent”生成原型。业务人员无需指定页面类型、模板、平台、图标、HTML 或输出路径。

## 必须先读取：核心上下文

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
- `templates/page-content.template.html`
- `templates/partials/common/states.template.html`
- `qa/pc-ant-component-checklist.md`
- `skills/admin-query-flow/SKILL.md`

## 分类后按需读取：只选一个页面族分支

- 判定为 `list`：读取 `specs/list-pattern-rules.md`、`templates/list.template.html`、`templates/partials/list/` 和所需 Ant 原语。
- 判定为 `form`：读取 `specs/form-pattern-rules.md`、`templates/modal-form.template.html`、`templates/partials/form/` 和所需 Ant 原语。
- 判定为 `detail`：读取 `specs/detail-pattern-rules.md`、`templates/detail.template.html`、`templates/partials/detail/` 和所需 Ant 原语。
- 判定为 `result`：读取 `specs/result-pattern-rules.md`、`templates/result.template.html`、`templates/partials/result/` 和所需 Ant 原语。
- 同一次单页面任务不得全量读取其他页面族的规则和模板；只有本次 Page Spec 明确组合多个页面族时，才读取额外分支。

## 固定执行规则

1. 根据本次需求自动判定 `Page Spec`：菜单路径、页面族、展示形式、能力组合、字段、状态、交互、校验、路由、辅助资产和风险提示。不得沿用上一个需求的页面类型或能力组合。
2. 先从 `content-pattern-catalog.md` 选择页面族，再从对应规则中选择能力：
   - 查询、筛选、结果列、分页：候选为 `list`。
   - 新增、编辑、配置、录入：候选为 `form`；必须按导入复核闭环、阶段依赖、信息分组、单阶段
     收集的顺序选择 `template.id`，分别为 `form.import-review-flow`、
     `form.staged-configuration`、`form.grouped-configuration`、`form.single-stage`。
   - 查看单据、记录、账户信息：候选为 `detail`。
   - 提交完成、失败、处理中：候选为 `result`。
   - 少量独立字段或当前步骤字段较少，且右侧说明/资产确实帮助理解或核对时，可叠加 `form.sideIllustration`；它可用于单阶段表单或分阶段表单。
   上述是判断依据，不是关键词替换，更不是默认页面模板。`form.steps`、`form.groups` 等只作为
   选定模板后的能力组合。
3. 完整业务规则、数据源、实名校验、资金风险等写入 Page Spec 的 `validation`、`rules`、`assumptions`；页面只展示用户填写所需的短 label、placeholder、短 helperText 和错误提示。
4. 业务人员给出截图时，截图用于判断布局和视觉意图；不得照抄截图中的 Shell，而是由固定 Shell 注入。
5. Page Spec 必须记录“选择理由”和“未选择能力”，使产品、UI、前端可审核本次判断。只有菜单路径、目标用户、关键字段或提交去向无法判断且会改变页面结构时，才提一个简短澄清问题；其余信息自行合理推断，并在 Page Spec 的 `assumptions` 中记录。
6. 当前平台固定为 `admin-pc-ant`。只生成 `#page-content`；Shell、菜单、TopBar、Tabs、页脚由固定框架提供。
7. 所有图标使用本地 Ant SVG 精灵和 `data-icon` 语义；生成后运行图标校验，再调用预览构建器生成完整预览。

## 执行边界

1. 在内部完成“需求理解 -> Page Spec -> 内容区生成”，不要在对话中反复叙述中间推理。
2. 生成后只允许执行两类自动验证：`check-pc-ant-icons.mjs` 静态图标校验和 `build-preview.mjs` 预览构建。
3. 静态校验失败时，最多修正一次后重跑失败的校验；通过后立即结束。
4. 禁止自动进行浏览器目视检查、截图对比、互评审、审美打分、文案微调或无明确结束条件的自主迭代。页面视觉效果由用户打开 `preview.html` 后验收。
5. 禁止在默认视图预先渲染提交成功、失败、加载等状态；它们只作为交互状态结构或 Page Spec 转场声明存在。

## 交付内容

为本次业务需求建立唯一的业务标识目录：

- `outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/page-spec.yaml`
- `outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/page-content.html`
- `outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/checklist.md`
- `outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/preview.html`

最终仅汇报四个产物路径和一个不超过三行的风险/假设摘要，不粘贴完整 HTML。

## 业务需求

{{在这里粘贴业务人员的原始需求，可附截图}}
