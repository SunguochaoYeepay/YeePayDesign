# Admin PC Ant Form Context Pack

依赖：先读取 `admin-pc-ant-core.md`。适用 `family: form` 的新增、编辑、配置、录入、
导入与提交页面。页面由固定 Vue / Ant Design Vue 运行层渲染；业务 Agent 只写
`page-spec.yaml`，不写表单、Select、Radio、Tabs、Upload、Table、Modal、按钮或页面脚本。

## 模板注册表

每个新表单必须声明 `template.id`。Agent 按业务证据而非页面标题、截图风格或字段数量单独
选择模板；`form.steps`、`form.groups`、`form.uploadFlow` 等是能力修饰项，不能直接作为模板名。

| `template.id` | 模板名称 | 选择条件 | 默认组合 |
| --- | --- | --- | --- |
| `form.single-stage` | 单阶段信息收集表单 | 少量独立字段、一次收集和提交、无前后依赖。 | `form.simple`，单列字段内操作，最多 7 个可编辑字段；资金、开户等需要核对说明时可加右侧提示区。 |
| `form.grouped-configuration` | 分组配置表单 | 字段较多或至少两个信息组，但无强制先后顺序。 | `form.groups + form.stickyActions`，Card 分组与多列网格。 |
| `form.staged-configuration` | 分阶段配置表单 | 前一阶段完成后，才能填写、确认或进入下一阶段。 | `form.steps + form.confirmation`；可编辑步骤用 `fieldKeys` 指定字段，末步固定为只读确认。 |
| `form.import-review-flow` | 导入复核流程表单 | 上传、校验、只读复核、确认和结果形成闭环。 | `form.steps + form.upload + form.reviewTable + form.uploadFlow + form.stickyActions`，按需加入 `form.modeTabs`。 |

## 当前可用能力

| 业务意图 | 能力 | 选择条件 |
| --- | --- | --- |
| 少量独立字段 | `form.simple` | 不超过 7 个字段，且没有明确的前后依赖。 |
| 明确步骤依赖 | `form.steps` | 前一步完成后才能填写、确认或进入下一步。 |
| 右侧说明配图 | `form.sideIllustration` | 单阶段或分阶段表单字段不多，且资金、开户、服务说明确实帮助理解或核对。 |
| 复杂信息分组 | `form.groups` | 8 个以上字段，或至少两个相对独立的信息组。 |
| 底部悬停操作 | `form.stickyActions` | 分组多列、批量导入、复核确认等页面级任务。 |
| 两种互斥录入方式 | `form.modeTabs` | 单条/批量、手工/文件等需要切换且字段不同的方式。 |
| 文件上传 | `form.upload` | 需要上传单个或多个受限格式文件。 |
| 上传后复核表 | `form.reviewTable` | 文件校验通过后，需要核对解析出的结构化记录。 |
| 上传完整流 | `form.uploadFlow` | 上传 -> 校验 -> 确认 -> 完成的三步或更多闭环。 |

不支持的控件或组合不得用静态 HTML 假造。当前尚未开放 DatePicker、Cascader、TreeSelect、
独立表单 Drawer、复杂条件显隐、嵌套分组、上传错误行下载和独立 `result` 页面；需先扩展
渲染器与本 Context Pack。唯一例外是 `list.workflow.createDrawer`：它属于列表工作流，只支持
少字段新增、Ant Form 校验、本地新增一条记录及关闭抽屉，规则以 `admin-pc-ant-list.md` 为准。

## 选择规则

按以下固定顺序判断，命中即停止，不得用模板名称做模糊猜测：

1. 出现上传、校验、只读复核、确认和结果闭环时，选择 `form.import-review-flow`。
2. 前一步完成后才能进入下一步、确认或填写后续信息时，选择 `form.staged-configuration`。
   所有字段仍声明在 `form.fields`；每个可编辑步骤必须以 `steps[].fieldKeys` 明确列出本步骤
   字段，最后一步由 `form.confirmation` 渲染只读核对，不能只写步骤标题或 `stepValidation`。
3. 没有阶段依赖，但字段较多或至少两个独立业务对象需要分别核对时，选择
   `form.grouped-configuration`。
4. 其余少量独立字段的一次收集与提交，选择 `form.single-stage`。
5. 单阶段或当前阶段字段不多，且说明图可帮助资金、开户或服务理解时，可加
   `form.sideIllustration`；它固定为左侧单列字段区与右侧提示区，不能与 `form.groups` 组合。
6. 录入方式互斥时，按当前模板叠加 `form.modeTabs`；切换方式会清空方式字段与校验，公共
   字段保留。它不是第五种模板。

## 组合限制

- `form.sideIllustration` 可用于单阶段或分阶段表单，并固定为左侧单列字段区与右侧提示区。
- `form.groups` 与 `form.sideIllustration`、`form.modeTabs` 不能组合。
- `form.groups` 必须使用 `fieldLayout: multi-column`、`columns` 和
  `actions.placement: sticky-end`。
- 分组表单的 `sticky-end` 操作栏固定在 Shell 工作区底部、版权栏上方，不随表单内容滚动；
  次操作居左、主操作居右。
- `form.uploadFlow` 必须声明至少三个 Steps、一个上传字段、复核表、结果摘要与粘性操作栏。
- 单列简单表单、短弹窗表单不使用粘性操作栏；不能只因按钮叫“下一步”就固定到底部。
- 没有 `form.groups` 的表单使用“16px 灰色工作区 + 整块白色表单面”；只有复杂分组表单
  才使用灰色承载面和白色 Card 信息组。分组表单的外层不能使用整块白色背景或圆角 Card。

## Vue/Ant 规格契约

所有新表单必须使用：

```yaml
template:
  id: form.single-stage
page:
  family: form
  presentation: page
ui:
  platform: admin-pc-ant
  runtime: vue-ant
  rendererVersion: 2
content:
  capabilities: [form.simple]
form:
  fieldLayout: single-column
  actions:
    placement: control-start
    primaryLabel: 提交
  fields: []
  submit:
    disabledUntil: []
    successTarget: ''
```

每个字段至少声明：`key`、`label`、`control`、`required`；适用时补充 `default`、
`placeholder`、`options`、`helperText`、`validationRules`。当前映射的 `control`：

| Page Spec control | Vue / Ant 组件 |
| --- | --- |
| `static` | 静态值容器 |
| `input` | `a-input` |
| `select` | `a-select` |
| `radio` | `a-radio-group` |
| `upload` | `a-upload` |

### 分组配置写法

```yaml
template:
  id: form.grouped-configuration
content:
  capabilities: [form.groups, form.stickyActions]
form:
  fieldLayout: multi-column
  columns: 4
  actions: { placement: sticky-end, primaryLabel: 保存并提交 }
  groups:
    - key: basic
      title: 基本信息
      fields:
        - { key: merchantName, label: 商户名称, control: input, required: true }
        - { key: contactAddress, label: 联系地址, control: input, required: true, span: 2 }
    - key: settlement
      title: 结算信息
      fields:
        - { key: settlementAccount, label: 结算账户, control: input, required: true }
```

### 分阶段配置写法

```yaml
template:
  id: form.staged-configuration
content:
  capabilities: [form.steps]
form:
  fieldLayout: single-column
  actions: { placement: control-start, primaryLabel: 确认并提交 }
  steps:
    - { key: account, title: 设置账户, status: process, fieldKeys: [accountType, accountNumber] }
    - { key: payee, title: 设置入账信息, status: wait, fieldKeys: [payeeName, splitRatio] }
    - { key: confirm, title: 确认并生效, status: wait }
  fields:
    - { key: accountType, label: 账户类型, control: radio, required: true, options: [{ label: 借记卡, value: debit }] }
    - { key: accountNumber, label: 银行账户号码, control: input, required: true }
    - { key: payeeName, label: 入账方名称, control: input, required: true }
    - { key: splitRatio, label: 分账比例, control: input, required: true }
  confirmation:
    step: confirm
    title: 请确认变更信息
    fields: [accountType, accountNumber, payeeName, splitRatio]
  submit:
    failureSimulation: { field: accountNumber, endsWith: '0' }
    preserveOnError: true
    result:
      status: success
      title: 结算账户变更已提交
      description: 变更将在下一结算周期生效。
```

### 导入复核写法

```yaml
template:
  id: form.import-review-flow
content:
  capabilities: [form.steps, form.upload, form.reviewTable, form.uploadFlow, form.stickyActions]
form:
  fieldLayout: single-column
  actions: { placement: sticky-end, primaryLabel: 下一步 }
  steps:
    - { key: upload, title: 上传文件, status: process }
    - { key: review, title: 确认信息, status: wait }
    - { key: result, title: 完成, status: wait }
  fields:
    - { key: uploadFile, label: 上传文件, control: upload, required: true, accept: [.xlsx] }
  uploadFlow:
    review: {}
    result: {}
```

## 交互、对齐与响应式

- 单阶段和分组表单以 `form.submit.disabledUntil` 列出主按钮启用所需字段；分阶段表单由当前
  `steps[].fieldKeys` 中的必填字段控制“下一步”，不再重复填写全表单禁用条件。
- 分阶段表单的 `actions.primaryLabel` 是最后确认页的主操作，必须使用“确认并提交”“确认生效”
  等最终语义；中间步骤由运行器固定显示“下一步”。确认步骤不得声明 `fieldKeys`，只通过
  `form.confirmation.fields` 定义只读核对内容。
- 分阶段表单的成功提交必须声明 `form.submit.result`。提交成功后固定
  切换到 Ant `Result` 结果页面，隐藏步骤条与表单；失败时仍停在当前确认页供用户返回修改。
  结果对象只需要 `status`、`title` 和 `description`；未声明后续动作时，运行器提供“返回上一页”。
- 单选切换、字段清空、后端失败模拟必须使用结构化声明。例如
  `interactions: [{ on: changeMode, effect: clear-editable-fields }]`；卡号末位为 `0` 模拟四要素
  失败时使用 `submit.failureSimulation: { field: bankAccountNumber, endsWith: '0' }` 与
  `submit.preserveOnError: true`。不得用辅助文案替代已支持的交互。
- Ant Form 负责字段级校验；提交失败滚动到第一个错误字段。失败 Modal 保留已填写值并提供
  返回修改动作。
- 单列表单的 label 右对齐，帮助/错误文本位于控件下方，主按钮紧随最后字段并贴齐控件左边。
  普通次操作在主操作之后。
- 粘性操作栏的次操作在左、主操作在右。它横跨页面内容底部，不放入任一字段列。
- 侧插图在桌面及平板宽度（`>= 768px`）持续保持右侧双栏，不得在中间宽度移到表单之后；
  在 `768px` 以下隐藏，表单自动占满可用宽度。复杂组在 960px 以下降为两列、680px 以下
  降为一列。页面 Spec 不携带局部 CSS 或断点。
- 用户截图只用于判断布局、信息层级和留白，禁止作为页面图片或背景嵌入。没有真实资产时，
  只使用运行器的图片形态占位。
