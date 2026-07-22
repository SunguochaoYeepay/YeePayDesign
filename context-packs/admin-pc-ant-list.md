# Admin PC Ant List Context Pack

依赖：先读取 `admin-pc-ant-core.md`。适用 `family: list` 的查询、规则管理、订单、
对账和待处理清单页面。页面由固定 Vue / Ant Design Vue 运行层渲染；业务 Agent 只写
Page Spec，不写表格、Select、分页、图标或页面脚本。

## 页面与能力选择

所有当前可用的简单列表都必须包含：一个查询能力、`table.flat` 和
`table.pagination`。

| 业务意图 | 能力 | 选择条件 |
| --- | --- | --- |
| 常规查询 | `query.basic` | 最多 6 个字段，不需要收起/展开。 |
| 可折叠查询 | `query.advanced` | 字段超过 6 个，或存在明确的次要查询条件。 |
| 时间区间 | `query.dateRange` | 查询字段需要起止日期。 |
| 快捷日期 | `query.quickRanges` | 日期区间旁需要“今日/昨日/近 3 日”等快捷填充。 |
| 紧凑统计 | `summary.count` / `summary.amount` | 仅 1 至 2 项总数、状态数或金额，放在工具栏左侧。 |
| 标准统计卡片 | `statistics.cards` | 有 3 至 5 项重要指标，且卡片本身没有操作。 |
| 富统计卡片 | `statistics.cards.rich` | 有 3 至 5 项重要指标，且至少一张卡片需要业务操作。 |
| 工具栏 | `table.toolbar` | 有新增、次级操作、导出、刷新或列设置。 |
| 文本跳转 | `table.link` | 列单元格可进入查看、编辑等业务动作。 |
| 标签 | `table.tags` | 列值需要多个分类/业务标签。 |
| 状态 | `table.status` | 列值需要成功、处理中、警告、失败等状态点。 |
| 金额 | `table.amount` | 金额需要千分位、小数位和右对齐。 |
| 固定操作列 | `table.fixedActions` | `actions` 列固定在表格右侧。 |
| 危险确认 | `table.confirmAction` | 行操作如失效、删除、终止需要二次确认。 |
| 多选列 | `table.selection` | 用户需要选择多条当前查询结果中的记录。 |
| 批量操作 | `table.batchActions` | 所选记录需要执行同一种批量业务动作。 |
| 展开子表 | `table.expandable` | 父记录需要查看同一层级的多条明细，且子数据适合用紧凑表格呈现。 |
| 导出 | `table.export` | 工具栏出现导出图标。 |
| 刷新 | `table.refresh` | 工具栏出现刷新图标。 |
| 列设置 | `table.columnSettings` | 工具栏出现列设置图标，可显示/隐藏、拖拽排序、重置。 |
| 新增抽屉闭环 | `list.workflow.createDrawer` | 列表主按钮打开少字段表单抽屉，校验通过后仅在当前浏览器会话新增一条记录并关闭。 |
| 详情抽屉闭环 | `list.workflow.detailDrawer` | 列表行操作打开当前记录的只读详情抽屉，关闭后保留列表与筛选状态。 |

不支持的能力不得用静态 HTML 假造：树形行、服务端分页、复杂筛选器、嵌套展开、子表
分页和批量浮动操作条。它们需要先扩展渲染器和本 Context Pack。

## 列表内抽屉工作流

当业务明确要求“在同一列表里新增并立即看到新记录”或“查看后回到未丢失上下文的列表”时，
可在同一个 `family: list` Page Spec 声明 `workflow`。这不是三个独立页面，也不允许嵌套任意
表单、编辑、删除、接口调用、跨页跳转或服务端状态。

```yaml
content:
  capabilities: [query.basic, table.toolbar, table.flat, table.pagination, list.workflow.createDrawer, list.workflow.detailDrawer]
table:
  primaryAction: { key: create, label: 新增规则 }
  rowActions: [{ key: detail, label: 详情 }]
workflow:
  createDrawer:
    trigger: create # 必须等于 table.primaryAction.key
    title: 新增规则
    form:
      primaryLabel: 保存
      cancelLabel: 取消
      fields: [] # 仅少字段独立表单
    addRow:
      keyPrefix: R
      fields:
        ruleName: { from: ruleName }
        status: { value: active }
  detailDrawer:
    trigger: detail # 必须等于一个已声明的行操作或链接操作 key
    title: 规则详情
    groups:
      - key: basic
        title: 基本信息
        fields:
          - { key: ruleName, label: 规则名称, sourceKey: ruleName }
```

- 新增抽屉的 `addRow.fields` 必须映射每个非操作表格列；行主键由运行层使用 `keyPrefix`
  自动生成。保存先执行 Ant Form 校验，成功后把新记录放到当前列表首行。
- 详情字段只可使用 `sourceKey` 读取当前点击记录；详情抽屉为只读，关闭不会刷新、重置或跳转。
- 需要多步骤、分组、上传、编辑、删除、服务端保存、复杂关联明细或全页面详情时，不得使用本
  工作流，应由后续能力单独开放。

## 模板分类

通用列表 POC 固定分为五类：

1. 列表 + 简单操作：基础查询、平铺表格、固定行操作与分页。
2. 列表复杂用法：高级查询、日期范围/快捷日期、语义列、工具栏与列设置。
3. 列表 + 统计：标准统计或富统计卡片。
4. 列表 + 批量操作：选择列、批量动作和选择状态条。
5. 列表 + 子表格：父行展开只读从属表。

业务名如“规则管理”不属于模板分类；它们仅作为业务回归样例，不能影响页面族选择。

## 查询规格

```yaml
query:
  collapsible: true # query.advanced 时必填；也可为 auto
  collapseThreshold: 6 # 可选，默认 6
  defaultExpanded: true
  fields:
    - key: ruleName
      label: 规则名称
      control: input
      placeholder: 请输入规则名称
      filterKey: ruleName
    - key: createdAt
      label: 创建时间
      control: date-range
      filterKey: createdAt
      default: last7days
  quickRanges: [today, yesterday, last3days, last7days]
  defaultQuickRange: last7days
```

- 查询区固定为 3 列、40px 控件；`span: 1|2|3` 只用于确有必要的宽字段。
- `收起/展开`（如有）、`重置`、`查询`必须作为同一个操作组置于查询网格最后一个单元格，
  固定在最后一行最右列。条件未填满当前行时，操作组与该行右侧对齐；条件正好填满一行时，
  操作组进入下一行最右侧。不得把查询操作组固定渲染在网格外的独立行；`span` 字段按实际
  占格参与这一规则。
- `query.basic` 不能声明 `advanced: true`、`collapsible: true` 或
  `collapsible: auto`。
- `query.advanced` 必须声明 `collapsible: true` 或 `auto`。字段超过
  `collapseThreshold` 时会自动将超过阈值的字段折叠；字段不超过阈值时，必须至少有
  一个字段声明 `advanced: true`。
- `defaultExpanded: true` 默认展示全部字段；收起/展开只影响字段可见性，不清空值。
- `date-range` 使用 Ant RangePicker。没有 `quickRanges` 时，它是普通查询字段；声明
  `quickRanges` 时，必须且只能有一个 `date-range`，该时间条件组独占一行。快捷日期与
  RangePicker 横向排列，不能显示在控件下方；其他查询条件从下一行开始。用户点击“查询”
  后才应用筛选。需要置顶展示时，将该字段声明在 `query.fields` 首位；运行层不重排业务
  字段。可用快捷值：`today`、`yesterday`、`last3days`、`last7days`、
  `last30days`。
- 输入框按包含关系匹配，Select 按选项值精确匹配。`filterKey` 可把查询字段映射到
  原型行中的另一字段。

## 统计卡片规格

统计展示只能选择一种模式：1 至 2 项使用 `summary.count` / `summary.amount`，在表格
工具栏左侧紧凑展示；3 至 5 项使用统计卡片，位于查询区之后、表格之前。不得把紧凑摘要
和统计卡片混用，也不得用 3 项及以上的行内摘要代替统计卡片。

统计卡片分为两种：没有指标内操作时使用 `statistics.cards` 的 `standard` 布局；只要任一
统计项需要“查看明细”“立即结算”等操作，就使用 `statistics.cards.rich` 的 `rich` 布局。
统计卡片不是列表默认装饰。

```yaml
statistics:
  layout: rich # standard 或 rich
  items:
    - key: transactionAmount
      label: 交易总金额
      unit: 元
      format: amount
      aggregate: { op: sum, field: transactionAmount }
      helpText: 当前查询结果中的交易金额汇总。
      detailItems: [共 6,000 笔]
      action: { key: viewDetails, label: 查看明细 }
    - key: completedOrders
      label: 已完成订单
      format: number
      aggregate: { op: count, where: { field: status, equals: completed } }
```

- `statistics.items` 必须有 3 至 5 张卡片；相同业务维度的补充信息放在同一张卡内，
  不拆成重复指标。
- `format: amount` 固定使用千分位和两位小数；`format: number` 固定使用千分位且不显示
  小数。数值必须是 number，不能把已经格式化的字符串写入 Page Spec。
- 每个统计项二选一使用 `value` 或 `aggregate`。`value` 适合独立统计接口返回的数值；
  `aggregate` 从当前已应用查询的原型行计算，支持 `sum`、`count` 和可选 `where`。
- `helpText` 映射为标题旁的 Ant Tooltip。`unit` 会显示为标题单位，例如
  `交易总金额(元)`。
- `layout: standard` 只显示标题、说明和数值，不能声明 `detailItems` 或 `action`。
  `layout: rich` 必须至少有一张卡声明 `action`；明细是补充文字，动作只可使用结构化
  `{ key, label }`。
- 统计卡片位于查询区之后、表格之前。表格可声明 `sectionTitle`，例如“交易订单”。
  不要在工具栏摘要中重复同一项统计。

## 表格规格

```yaml
table:
  rowKey: ruleId
  sectionTitle: 交易订单
  summary:
    items:
      - { type: value, label: 共, value: 24, suffix: 条规则 }
      - { type: value, label: 生效中, value: 18, suffix: 条 }
      - { type: sum, label: 待处理金额, field: amount, currency: CNY, currencyDisplay: prefix }
  columns:
    - { key: ruleName, label: 规则名称, format: link, action: { key: detail, label: 查看 }, ellipsis: true }
    - { key: status, label: 状态, format: status, statusMap: { active: { label: 生效中, tone: success } } }
    - { key: amount, label: 金额, format: amount, currency: CNY, currencyDisplay: prefix, precision: 2 }
    - { key: actions, label: 操作, fixed: right, required: true }
  rowActions:
    - { key: edit, label: 修改 }
    - { key: invalidate, label: 失效, danger: true, confirm: 确认将该规则置为失效？ }
  pagination: { total: 8, page: 1, pageSize: 20, pageCount: 1 }
  rows: []
```

- `table.rows` 必须是结构化原型数据，每行都包含 `rowKey`。当前是客户端原型列表，
  `pagination.total` 必须等于 `rows.length`；不能伪造服务端总数。
- 工具栏摘要有两类数据来源：`count`、`active`、`sum` 从当前原型行聚合；`value` 使用
  业务明确提供的独立统计值。`value` 必须提供数值 `value` 和展示单位 `suffix`，不得声明
  `field` 或 `equals`。例如当前页只展示 8 条样例记录，但业务明确要求“共24条规则、
  生效中18条”时，两个指标都必须使用 `type: value`，不得从 8 条样例行推导。
- 列的 `format` 可为 `text`、`datetime`、`link`、`tag`、`status`、`amount`。
  `datetime` 可加 `dateFormat`；`link` 可加 `action`；`tag` 使用 `tagMap`；`status`
  使用 `statusMap`；`amount` 可声明 `precision`、`currency`、`currencyDisplay`、
  `showSign`。`ellipsis: true` 会展示省略和完整文本提示。
- 固定操作列必须为 `{ key: actions, fixed: right }`，同时选择
  `table.fixedActions`。操作列自动保持可见、不可拖拽。
- 默认动作写在 `rowActions`；单行差异写在该行 `actions`。`confirm` 是确认文案，
  运行层映射为 Ant Popconfirm，不得使用浏览器确认框。
- 不会因为主工具栏里有“批量配置”等文字自动增加勾选列。只有同时声明
  `table.selection` 和 `table.batchActions` 时才会渲染多选列。

## 选择与批量操作

只有用户明确需要对多条记录执行同一种业务动作时，才组合 `table.selection` 与
`table.batchActions`。两者必须同时声明，不能只显示无用途的复选框，也不能只放一个
名称中带“批量”的普通按钮。

```yaml
table:
  selection:
    mode: multiple
    itemLabel: 规则
    quickActions: [all-results, current-page, invert-current-page, clear]
  batchActions:
    - { key: batchEnable, label: 批量启用 }
    - { key: batchInvalidate, label: 批量失效, danger: true, confirm: 确认失效已选规则？ }
```

- 默认显示多选列，但所有 `batchActions` 在未选择记录时禁用；普通新增、导出和行操作
  不受影响。
- 表头下拉固定包含：`all-results`、`current-page`、`invert-current-page`、`clear`。
  全选覆盖当前查询结果；选择当前页替换当前选择；反选只切换当前页，并保留其他页已选；
  清空取消所有选择。
- 选中后在工具栏与表格之间显示“已选择 N 条{{itemLabel}}”状态条及“取消选择”。
  翻页和改变每页条数保留已选记录；点击查询或重置后清空选择。
- 批量危险动作使用 Ant Popconfirm。当前客户端原型中“当前查询结果”就是已加载且已应用
  查询的 `rows`；服务端分页的跨页全选需要未来单独建设，不能在此能力中假装支持。

## 工具栏与分页

```yaml
table:
  secondaryActions:
    - { key: batchConfig, label: 批量配置 }
  primaryAction: { key: create, label: 新增分账规则 }
  tools: [export, refresh, settings]
  pagination:
    total: 8
    page: 1
    pageSize: 20
    pageCount: 1
    pageSizeOptions: ['20', '50', '100']
```

- 工具栏左侧为 `sectionTitle` 或 `summary`，右侧顺序为次级操作、主操作、图标工具。
- `export`、`refresh`、`settings` 分别需要 `table.export`、`table.refresh`、
  `table.columnSettings`。它们使用固定 Ant 图标和 Tooltip。
- 列设置提供显示/隐藏、拖拽排序和重置；固定操作列不能隐藏或拖动。
- 分页由 Ant Pagination 渲染。`pageCount` 若声明，必须与 `total/pageSize` 一致；
  换页和每页条数变化由运行层处理。

## 父表展开子表

`table.expandable` 只用于父记录与其多条明细存在明确从属关系，且用户需要在不离开
列表的前提下横向核对明细。首版只支持无分页、无操作、无嵌套展开的只读子表；它不是
行详情、树形表或任意内容容器的替代品。

```yaml
table:
  rowKey: ruleId
  expandable:
    mode: multiple
    defaultExpanded: false
    childRowsKey: childRows
    childTable:
      rowKey: entryId
      columns:
        - { key: entryName, label: 入账方名称 }
        - { key: amount, label: 分账金额, format: amount, currency: CNY, currencyDisplay: prefix }
  rows:
    - ruleId: R001
      childRows:
        - { entryId: E001, entryName: 北京门店, amount: 1280.00 }
    - ruleId: R002
      childRows: []
```

- 父行默认全部收起，`mode` 固定为 `multiple`，用户可以同时展开多条父记录。
- 每个父行都必须声明 `childRowsKey` 数组；空数组表示该行没有子表数据，运行层不显示
  展开控件。
- 子行键在各自父行内唯一。子表用真实 Ant Table 渲染，固定无分页、无选择、无批量操作、
  无嵌套展开，也不承载行操作或跳转链接。
- 点击查询或重置会清空展开状态；在相同查询结果内翻页或切换每页条数时保留展开状态。
- 当前 `table.expandable` 不能与 `table.selection`、`table.batchActions` 组合。需要两种
  交互同时出现时，先建设并验收明确的组合语义，不能直接混用。

## 布局与状态

- 内容面策略由任务块数量决定：只有一个主任务区时使用整块白底；两个或更多独立任务
  块时使用 `rgba(0, 0, 0, 0.04)` 承载面，各块之间保留 16px 并露出灰色底面。当前
  列表至少包含查询区与结果区，因此属于多块布局；查询区、统计区和列表区各自为白色
  内容面。
- 统计卡是唯一允许的同级重复卡片，使用克制的浅色内容面；不能用它替代查询、表格或
  任意说明区的装饰卡片。
- 列表优先展示真实业务数据。`loading`、`empty`、`error` 只在 Page Spec 的
  `content.states` 中声明，不在默认首屏预先渲染。
- 所有按钮、Select、DatePicker、Table、Tooltip、Popconfirm、Popover 和 Pagination
  均由 Vue / Ant 运行层提供键盘、焦点与交互行为；Page Spec 不携带 Vue props 或页面
  事件代码。
