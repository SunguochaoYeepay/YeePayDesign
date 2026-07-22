# 表单页面规则

表单页面使用 `family: form`。页面形态由字段规模、信息结构和任务流程决定，不由“新增”
“下一步”或字段数量单独决定。Agent 依据 `template.id` 和可判定的业务证据选型；
`page.name` 始终保留业务页面名称，不能承担模板身份。

## 1. 模板注册表与选择顺序

| `template.id` | 模板名称 | 选择证据 | Page Spec 能力与布局 |
| --- | --- | --- | --- |
| `form.single-stage` | 单阶段信息收集表单 | 少量独立字段，无前后依赖；目标是一次收集并提交。 | `form.simple`、单列、标签右对齐、字段内操作；最多 7 个可编辑字段，按需叠加右侧说明插图。 |
| `form.grouped-configuration` | 分组配置表单 | 字段较多或至少两个信息组，但没有强制的先后填写顺序。 | `form.groups + form.stickyActions`；Card 分组、多列网格、底部操作栏。 |
| `form.staged-configuration` | 分阶段配置表单 | 前一阶段完成后才能填写、确认或进入下一阶段。 | `form.steps`；当前阶段可为少字段单列，或为多个信息组加 `form.groups + form.stickyActions`。 |
| `form.import-review-flow` | 导入复核流程表单 | 上传、校验、只读复核、确认和结果构成闭环。 | `form.steps + form.upload + form.reviewTable + form.uploadFlow + form.stickyActions`；按需加入 `form.modeTabs`。 |

选择顺序固定为：先判断是否存在导入复核闭环，再判断是否存在明确阶段依赖，再判断是否
需要信息分组，最后才使用单阶段收集。`form.steps`、`form.groups`、`form.modeTabs` 与
`form.uploadFlow` 是能力修饰项，不能作为模板名称；字段多但不存在依赖时，不得为了
“看起来复杂”使用 Steps。

## 2. Page Spec 结构

所有 `form` 页面必须声明：

```yaml
template:
  id: form.single-stage
form:
  fieldLayout: single-column # 或 multi-column
  actions:
    placement: control-start # 或 sticky-end
    primaryLabel: 提交
  fields: []
  submit:
    disabledUntil: []
    successTarget: ''
```

每个字段必须有 `key`、`label`、`control`；必填字段声明 `required: true`。字段应区分
`label`、`placeholder`、`helperText` 与 `validationRules`。复杂业务政策、数据源描述和
服务端校验过程留在 `rules` 或 `assumptions`，不得塞进字段网格。

### 2.1 单阶段信息收集表单 `form.single-stage`

```yaml
template:
  id: form.single-stage
content:
  capabilities: [form.simple]
form:
  fieldLayout: single-column
  actions: { placement: control-start, primaryLabel: 提交 }
  fields:
    - { key: accountName, label: 账户名称, control: input, required: true }
```

- 单阶段信息收集表单最多 7 个可编辑字段，不能使用 Steps、信息组、粘性操作栏、方式 Tabs
  或上传复核流。
- 资金、开户、产品服务等少字段单阶段表单需要解释或核对提示时，可使用
  `form.sideIllustration`，形成左侧字段区与右侧提示区；它不是分阶段表单专属能力。
- 单列简单表单和上传流均属于单一内容面：在页面 16px 外边距内使用整块白色
  表单面；外侧保留 `rgba(0, 0, 0, 0.04)` 灰色工作区，不额外套 Card。

### 2.2 分组配置表单 `form.grouped-configuration`

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
    - key: merchant
      title: 商户信息
      description: 核对主体与联系人信息。
      fields:
        - { key: merchantName, label: 商户名称, control: input, required: true }
        - { key: registeredAddress, label: 注册地址, control: input, required: true, span: 2 }
```

- 分组配置表单不声明 Steps。每组由 Ant Card 承载，Card 是信息分块，不是装饰卡片。
- `fieldLayout: multi-column` 必须同时声明 `form.groups` 和 `columns: 2 | 3 | 4`。
  常规复杂后台表单在桌面端优先 4 列；跨列字段使用 `span`，不压缩长标签或长值。
- 多列字段采用标签在上、控件在下的垂直对齐。分组之间露出 16px 灰色承载面；只有单一
  主任务区才使用整块白色内容面。分组表单的外层背景必须透明且无圆角，不能再套白色容器。
- 复杂分组必须使用 `actions.placement: sticky-end`。操作栏固定在 Shell 工作区底部、版权栏
  上方，不随表单内容滚动；次操作在左、主操作在右，不可把提交按钮塞进最后一个字段列。
- 当前运行器不允许 `form.groups` 与 `form.sideIllustration` 或 `form.modeTabs` 组合。

### 2.3 分阶段配置表单 `form.staged-configuration`

```yaml
template:
  id: form.staged-configuration
content:
  capabilities: [form.steps, form.sideIllustration]
form:
  fieldLayout: single-column
  actions: { placement: control-start, primaryLabel: 下一步 }
  steps:
    - { key: base, title: 填写基础信息, status: process }
    - { key: confirm, title: 确认信息, status: wait }
  fields:
    - { key: accountName, label: 账户名称, control: input, required: true }
```

- `form.steps` 中必须恰有一个 `process` 步骤；已离开的步骤才使用 `finish`，不得以成功绿
  表示步骤完成。
- 首屏只声明当前步骤所需字段；后续步骤的字段、日期和确认摘要属于 `successTarget` 或
  独立 Page Spec，不能预先塞入首屏。
- 当前阶段字段不多且说明图确实帮助理解或核对时，可加 `form.sideIllustration`。该能力同样
  可用于单阶段表单；字段区保持单列。当包含多个独立信息组时，改用
  `form.groups + form.stickyActions`，并移除侧图。
- 分阶段配置不包含上传复核表或上传结果流；出现这些业务证据时改用导入复核流程表单。

### 2.4 导入复核流程表单 `form.import-review-flow`

```yaml
template:
  id: form.import-review-flow
form:
  modeTabs:
    defaultKey: batch
    items:
      - key: single
        label: 单条添加
        disabledUntil: [accountName]
        fields: []
      - key: batch
        label: 批量添加
        disabledUntil: [uploadFile]
        fields:
          - key: uploadFile
            label: 上传文件
            control: upload
            required: true
            accept: [.xlsx]
  uploadFlow:
    review: {}
    result: {}
```

- 导入复核流程先按上传、校验、复核、确认和结果拆分状态；不得把所有字段堆在一张超长
  表单中。
- `form.modeTabs` 仅用于互斥录入方式，不是普通内容分类 Tabs。方式字段键必须全局唯一；
  切换时清空所有方式字段并清除校验，公共字段保留。
- `form.uploadFlow` 必须完整声明至少三步、上传字段、校验通过后的只读复核表、底部确认栏和
  最终结果摘要。上传未通过时不进入复核表；复核表不得伪装为可编辑列表。
- 上传、确认、结果是同一表单流程状态，不额外创建菜单或 Shell 标签。

## 3. 排版与响应式

- 表单与右侧插图整体在内容区内居中；插图区域只用于产品属性说明，包含图片形态占位、
  简短标题和说明。用户截图不能直接作为页面图片。
- 没有 `form.groups` 的表单固定使用“16px 灰色工作区 + 整块白色表单面”；`form.groups`
  才使用灰色承载面与多个白色信息组 Card，不能把两种内容面策略混用。
- 单列表单的标签右对齐，帮助/错误文本只出现在控件下方。主按钮紧跟最后字段，并与输入
  控件左边对齐，不能与标签列或页面左缘对齐；普通次按钮位于主按钮之后。
- 复杂表单、批处理和上传确认使用底部悬停操作栏；单列简单表单不因“提交”或“下一步”
  字样自动获得悬停栏。
- 侧插图在桌面及平板宽度（`>= 768px`）持续为“左侧单列表单 + 右侧产品说明”的双栏布局，
  不在中间宽度换到表单之后；768px 以下隐藏侧插图且表单占满可用宽度。多列分组在 960px
  以下降为两列、680px 以下降为一列，悬停操作栏纵向堆叠。
- 标签、控件、错误文本和操作栏不能借助缩小字号来容纳长业务文案。应通过 `span`、换行、
  更合适的字段分组或详情页解决。

## 4. 交互与状态

- `form.submit.disabledUntil` 声明主按钮启用所需字段；必填未完成时禁用，不以错误提示替代。
- 字段副作用使用结构化声明，例如：

  ```yaml
  form:
    interactions:
      - { on: settlementMode, effect: clear-editable-fields }
  ```

- 失焦、选择变更和提交时均应使用 Ant Form 规则展示字段级错误；提交失败自动滚动并定位到
  第一个错误字段，已填写值必须保留。
- 异步失败模拟、实名校验或后端校验使用 `form.submit.failureSimulation` 与
  `failureBehavior` 声明。失败使用 Modal 或字段错误反馈，不能只在页面底部显示模糊提示。
- 单阶段和分阶段配置成功后通过 `successTarget` 进入下一任务；需要“上传 -> 确认 -> 完成”
  的可见结果时使用 `form.uploadFlow.result`。

## 5. 模板映射

| Page Spec 能力 | 局部模板 / 运行层 |
| --- | --- |
| `form.simple` | `templates/partials/form/fields.template.html` |
| `form.steps` | `templates/partials/form/steps.template.html` |
| `form.groups` | `templates/primitives/admin-pc-ant/form-layout.template.html` + Vue/Ant Card |
| `form.stickyActions` | `templates/partials/form/actions.template.html` |
| `form.modeTabs` | Vue/Ant Tabs |
| `form.upload` | `templates/partials/form/upload.template.html` + Vue/Ant Upload |
| `form.reviewTable` | `templates/partials/form/confirm.template.html` + Vue/Ant Table |
| `form.uploadFlow` | 上传、复核、结果状态转场 |
| `form.sideIllustration` | `templates/partials/form/side-illustration.template.html` |

## 6. 禁止事项

- 字段多不能直接推导为 Steps；不存在流程依赖时使用分组。
- 单列字段、弹窗表单和单步少量字段不得使用粘性操作栏。
- `form.groups` 不得与 `form.sideIllustration`、`form.modeTabs` 组合。
- 不得把需求原文、数据源说明、服务端校验过程放进 label、placeholder、helperText 或字段网格。
- 表单校验失败后不得只显示全局错误，必须定位首个错误字段。
- 不得从上一场景沿用 `family`、能力组合、输出目录或菜单路径；每次生成先根据当前业务需求重建 Page Spec。
