# 内容模式目录

本目录定义固定 Shell 内 `#page-content` 可以使用的内容模式。它服务于需求理解 Agent、页面生成 Agent、产品审核与 UI 审核。

目标不是积累大量相似 HTML 模板，而是把页面表达为：

```text
页面骨架 + 内容能力 + 交互状态 + 业务数据
```

固定 Shell 负责一级/二级菜单、TopBar、顶部标签、路由、响应式与全局工具；本目录只约束内容区。菜单点击打开或激活标签是 Shell 的默认行为，不需要业务人员重复描述。

## 1. 使用方式

1. 需求理解 Agent 从自然语言中推断 `family`、`capabilities`、`states` 和页面间动作。
2. 先输出 Page Spec，产品审核页面与交互是否完整。
3. 页面生成 Agent 只能从本目录选取允许的组合，生成 `#page-content`。
4. 没有本目录覆盖的模式时，先增加模式定义并经 UI 审核，再作为可复用能力使用。

`family` 不是由业务人员选择，而是由 Agent 推断：

| 自然语言线索 | 推断页面骨架 |
| --- | --- |
| 查询、筛选、结果列、记录、分页、批量操作 | `list` |
| 新增、编辑、填写、分步骤、导入 | `form` |
| 查看、信息、记录明细、资料、关联记录 | `detail` |
| 成功、失败、处理中、提交结果 | `result` |
| 待办、快捷入口、数据概览、通知 | `home` |

## 2. 通用约束

- 一个可路由页面只有一个内容骨架：`list`、`form`、`detail`、`result` 或 `home`。
- 页面只生成 `#page-content`，不得输出 Shell、菜单、TopBar、标签栏或页脚。
- 使用 `tokens.css` 和 `components.css` 中已有变量和类；没有设计确认，不新增任意色彩、圆角和阴影。
- 交互组件以 `presentation` 表示：`page`、`modal`、`drawer`、`inline-state`。
- `page` 可以有独立路由和 Shell 标签；`modal`、`drawer`、`inline-state` 默认不新增菜单和标签。
- 每个能力必须声明基础状态：`loading`、`empty`、`error`；有数据操作时还必须声明 `success` 或失败反馈。
- 同一页面内的标题、字段名、状态语义、金额/日期格式必须一致。

## 3. 列表骨架 `list`

适用：记录查询、规则管理、订单列表、对账列表、待处理清单。

### 能力模块

| 能力 | `capability` | 说明 |
| --- | --- | --- |
| 基础筛选 | `query.basic` | 左标签右控件，查询、重置；字段较少时使用。 |
| 高级筛选 | `query.advanced` | 支持折叠/展开、组合条件、较多字段。 |
| 日期快捷筛选 | `query.dateQuickFilter` | 今天、近 7 天、自定义等，与日期字段联动。 |
| 查询统计 | `summary.count` | 总数、状态数量等紧凑摘要。 |
| 指标摘要 | `summary.metrics` | 3-5 个关键指标，不替代列表主体。 |
| 工具栏 | `table.toolbar` | 新增、导出、刷新、列设置等。 |
| 平铺表格 | `table.flat` | 标准列、状态、金额、链接、操作列、分页。 |
| 批量选择 | `table.selection` | 行选择、全选、跨页全选、反选、清空、批量动作。 |
| 展开子表 | `table.expandable` | 父行展示摘要，展开后呈现紧密关联的子记录。 |
| 列能力 | `table.columnControls` | 排序、筛选、列内搜索、列显隐、固定操作列。 |
| 行操作 | `table.rowActions` | 查看、编辑、失效、下载等；危险操作须确认。 |
| 分页 | `table.pagination` | 默认开启，列过多时支持横向滚动。 |

### 组合规则

- `table.flat`、`table.expandable` 至少选择一个；两者可同时存在，表示同一张表可展开。
- `query.basic` 与 `query.advanced` 二选一。字段超过 4 个、存在逻辑组合或需折叠时使用 `query.advanced`。
- `summary.metrics` 可与 `summary.count` 共存，但总计不超过 5 个指标卡，且不应挤压筛选和表格空间。
- `table.selection` 必须有至少一个 `batchAction`；没有批量动作时禁止只展示复选框。
- `table.expandable` 的子表只用于从属记录，不可替代独立详情页。
- `table.rowActions.dangerous` 必须声明 `confirm`；不能直接执行。

### 必备状态

- `initial/loading`：筛选区域可用，表格展示骨架或加载态。
- `empty`：无结果时给出清晰空状态和可行动作。
- `selected`：批量选择后展示已选数量与批量操作条。
- `error`：查询失败时保留筛选条件并支持重试。

## 4. 表单骨架 `form`

适用：新增、编辑、配置、开户、导入、审核提交。

### 能力模块

| 能力 | `capability` | 说明 |
| --- | --- | --- |
| 简单表单 | `form.simple` | 少量字段，左侧标签、纵向表单。 |
| 表单说明图 | `form.illustration` | 可选的右侧说明/插图；窄屏隐藏。未生成时使用统一占位，后续由 OpenDesign 替换真实资产。 |
| 分步表单 | `form.steps` | 有明确先后依赖的流程。 |
| 分组表单 | `form.groups` | 复杂且并列的信息组，顶部标签，多列布局。 |
| 粘性操作栏 | `form.stickyActions` | 多步骤、长表单、批量处理时使用。 |
| 草稿 | `form.draft` | 支持暂存、恢复、离开确认。 |
| 文件上传 | `form.upload` | 上传、解析/校验、错误行提示、确认提交。 |
| 审核确认 | `form.confirm` | 提交前只读复核或二次确认。 |
| 提交结果 | `form.resultTransition` | 提交后进入结果状态或返回来源列表。 |

### 组合规则

- `form.simple` 与 `form.groups` 二选一；字段很少但需说明时可加 `form.illustration`。
- 字段多不自动等于 `form.steps`。只有业务存在明确顺序、前一步决定后一步时，才能使用步骤条。
- `form.steps` 可与 `form.groups` 结合：每一步内部可含一个或多个信息组。
- `form.upload` 默认组合为 `上传 -> 校验 -> 确认 -> 结果`，不能跳过校验结果。
- `form.stickyActions` 用于长页面、多步骤或批量提交；简短弹窗表单禁止使用。
- 必填校验失败后，聚焦并滚动到第一个错误字段；不能只在页面底部展示模糊错误。
- 编辑既有数据时，需在 Page Spec 声明初始值来源、是否可修改和未保存离开提醒。
- `form.illustration` 必须声明 `assetKey`、用途、画面主题和资产状态；初期使用 `placeholder`，不能以无关图片凑位。

### 展示形式判断

| 场景 | 默认 `presentation` |
| --- | --- |
| 少量字段的新增/编辑，不中断主任务 | `modal` |
| 需要保留列表上下文并查看较多字段 | `drawer` |
| 多步骤、导入、复杂配置或需独立审核 | `page` |

## 5. 详情骨架 `detail`

适用：订单详情、规则详情、账户详情、审核记录、对象全量资料。

### 能力模块

| 能力 | `capability` | 说明 |
| --- | --- | --- |
| 快速查看 | `detail.quickView` | 少量字段，无横向滚动。 |
| 分组字段 | `detail.groups` | 默认三列，长值可跨两列或整行。 |
| 锚点导航 | `detail.anchors` | 信息组紧密相关、页面较长时使用。 |
| 区段标签 | `detail.sectionTabs` | 信息组相对独立，或各组具备独立操作时使用。 |
| 关键摘要 | `detail.metrics` | 关键状态、金额、数量等摘要信息。 |
| 内嵌表格 | `detail.embeddedTable` | 关联记录、明细、操作日志。 |
| 页面操作 | `detail.actions` | 编辑、下载、撤销、返回等。 |

### 组合规则

- `detail.quickView` 默认用于 `modal` 或 `drawer`，字段过多时改为独立页面。
- `detail.anchors` 与 `detail.sectionTabs` 二选一：紧密连续的信息组用锚点；相对独立且可分别操作的信息组用区段标签。
- `detail.metrics` 只展示业务关键摘要，不超过 5 个。
- `detail.embeddedTable` 属于详情的一部分；需要复杂筛选、批量动作或单独路由时应拆为列表页面。
- 详情字段默认三列；长文本、地址、备注、复杂对象可跨列，禁止通过缩小字号硬塞。
- Shell 顶部标签与 `detail.sectionTabs` 是两层不同导航，Page Spec 必须分开声明。

### 展示形式判断

| 场景 | 默认 `presentation` |
| --- | --- |
| 快速核对、字段少 | `modal` |
| 单屏浏览、保留来源列表 | `drawer` |
| 信息多、含锚点/区段/表格或独立操作 | `page` |

## 6. 结果骨架 `result`

适用：提交成功、处理失败、处理中、批量导入结果、审核结论。

### 能力模块

| 能力 | `capability` | 说明 |
| --- | --- | --- |
| 基础结果 | `result.basic` | 状态图标、标题、说明、主次操作。 |
| 结构化摘要 | `result.summary` | 关键编号、数量、失败原因、处理明细。 |
| 后续动作 | `result.nextActions` | 返回列表、继续创建、查看详情、下载失败文件。 |
| 满意度反馈 | `result.feedback` | 成功结束时可选。 |

### 组合规则

- 所有结果必须有 `status`：`success`、`error`、`warning` 或 `processing`。
- `result.summary` 用于批量处理或需要解释结果的业务，简单成功无需堆叠摘要卡。
- `error` 必须提供可行动作：返回修改、重试、下载错误明细或联系支持。
- 结果通常是当前流程状态，默认 `inline-state` 或 `modal`，不创建菜单和 Shell 标签。
- 必须从 `form`、`list` 操作或异步任务入口关联到结果，不允许孤立设计结果页。

## 7. 首页骨架 `home`

首页规则先保留为独立主题。本阶段可使用：`home.todo`、`home.shortcuts`、`home.notifications`、`home.overview`，但不能将其与列表、详情、表单骨架混为一个页面。

## 8. 允许与禁止的组合

| 组合 | 结论 | 原因 |
| --- | --- | --- |
| 列表 + 高级筛选 + 批量选择 + 行操作 | 允许 | 常见管理场景，状态需完整。 |
| 列表 + 可展开子表 + 独立详情 | 允许 | 子表负责从属记录，详情负责完整信息。 |
| 列表 + 指标摘要 | 允许 | 指标只表达当前列表的核心概览。 |
| 简单表单 + 右侧说明图 | 允许 | 仅在说明对填写有帮助时使用。 |
| 分步表单 + 分组表单 + 粘性操作栏 | 允许 | 适用于复杂流程。 |
| 详情 + 锚点导航 + 区段标签 | 禁止 | 两种页面内导航会造成层级混乱。 |
| 列表 + 页面级复杂表单作为同一骨架 | 禁止 | 应通过 `modal`、`drawer` 或独立路由连接。 |
| 详情内嵌可筛选、可批量操作的大表 | 禁止 | 应拆分为独立列表。 |
| 无批量动作的复选框列 | 禁止 | 无业务价值，增加理解和操作成本。 |
| 提交后没有成功/失败反馈 | 禁止 | 流程未闭环。 |

## 9. Page Spec 扩展字段

在既有 `page-spec-rules.md` 基础上，新增以下内容区字段。字段可由需求理解 Agent 推断，产品审核后再生成 HTML。

```yaml
page:
  id: settlement-rule-list
  name: 余额分账规则设置
  family: list
  presentation: page
  route: /trade/balance-split/rules
  menuEntry: true
  tab: true

content:
  capabilities:
    - query.advanced
    - summary.count
    - table.toolbar
    - table.flat
    - table.selection
    - table.columnControls
    - table.rowActions
    - table.pagination
  states:
    required: [loading, empty, error, selected]
    default: data

query:
  fields:
    - key: ruleName
      label: 规则名称
      control: input
    - key: status
      label: 规则状态
      control: select
      options: [生效中, 已失效]
  collapsible: true

table:
  rowKey: ruleId
  columns:
    - key: ruleName
      label: 规则名称
      format: link
    - key: status
      label: 规则状态
      format: status
    - key: createdAt
      label: 创建时间
      format: datetime
  batchActions: [失效]
  rowActions:
    - label: 查看详情
      target: settlement-rule-detail
    - label: 编辑
      target: settlement-rule-edit
    - label: 失效
      dangerous: true
      confirm: 确认将该分账规则置为失效吗？

flow:
  entry: thirdLevelMenu
  transitions:
    - action: 新增分账规则
      target: settlement-rule-create
      presentation: modal
    - action: 查看详情
      target: settlement-rule-detail
      presentation: page
      tab: true
```

## 10. 审核清单

产品审核：

- 页面骨架是否符合实际任务，而非名称相似。
- 页面入口、菜单路径、独立标签、弹窗、抽屉是否正确。
- 查询条件、字段、表格列、表单字段、操作及流转是否完整。
- 默认补全项是否符合业务语义。

UI 审核：

- 是否只使用本目录允许的能力组合。
- 是否存在不必要的卡片、指标、图标、插图或页面内导航。
- 密度、字段栅格、长文本、状态色和操作层级是否符合 `DESIGN.md`。

生成前自检：

- 每个 `capability` 是否在对应 `family` 的允许范围内。
- 每个危险操作是否有确认，每个提交是否有结果反馈。
- 每个可路由页面是否与固定 Shell 的菜单/标签规则一致。
- 输出是否只包含 `#page-content`。

## 11. 后续落地顺序

本目录确认后再进行以下工作：

1. 将内容能力拆为 `list-pattern-rules.md`、`form-pattern-rules.md`、`detail-pattern-rules.md`、`result-pattern-rules.md`。
2. 建立对应的 HTML 局部模板和标准状态片段。
3. 扩展 `admin-query-flow` 与 `admin-feature-pack` Skill，使它们根据 Page Spec 自动选择组合。
4. 用真实业务需求验证一轮，再将已验证流程写入 README。
