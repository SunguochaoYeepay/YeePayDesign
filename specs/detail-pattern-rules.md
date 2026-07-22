# 详情页面规则

详情页面使用 `family: detail`，用于阅读、核对和有限的后续动作。它不承担查询筛选、批量
处理或完整编辑职责；这些任务分别属于 `list` 与 `form`。

## 1. 展示形式选择

| 业务情形 | `presentation` 与能力 | 约束 |
| --- | --- | --- |
| 少量字段、快速核对、无需关联明细 | `modal` + `detail.quickView + detail.groups` | 单一字段组；不滚动、不编辑、不放内嵌表。 |
| 从列表连续查看，保留来源上下文 | `drawer` + `detail.groups` | 右侧抽屉；可有少量分组和从属表，关闭后回到来源列表。 |
| 信息组连续关联、需要多屏定位 | `page` + `detail.groups + detail.anchors` | 点击锚点定位，滚动时由 Anchor 同步当前位置。 |
| 信息组相对独立、各组表达和动作不同 | `page` + `detail.groups + detail.sectionTabs` | 切换 Tabs，仅展示当前信息组。 |

- 详情存在编辑、配置或提交动作时，进入独立 `form` 页面；不得在 Modal 或 Drawer 中继续堆叠复杂编辑表单。
- `detail.anchors` 与 `detail.sectionTabs` 互斥，且都至少需要两个信息组。
- Drawer 不使用锚点或 Tabs；Modal 不使用从属表。
- 快捷 Modal 固定为一个字段组，组标题只作为 Page Spec 语义，不在弹窗内重复显示；不得套 Card、组说明或额外分区。
- Drawer 内的多个信息组只用标题与 24px 留白组织，不显示组间横线或组标题底线；Drawer Footer
  的关闭及后续操作固定右对齐。

## 2. Page Spec 结构

```yaml
page:
  family: detail
  presentation: page
content:
  capabilities: [detail.groups, detail.anchors]
detail:
  title: 商户资料详情
  groups:
    - key: basic
      title: 基本信息
      fields:
        - { key: merchantName, label: 商户名称, value: 某某商户, span: 2 }
        - { key: status, label: 状态, value: 生效中, format: status, tone: success }
```

`detail.title` 是弹窗/抽屉标题；独立页默认由 Shell Tab 和信息组标题表达任务，不重复渲染
页面 H1。

### 字段规则

- 每个详情字段必须有 `key`、`label`、`value`。`value` 只能是文本、数值或布尔值；格式可为
  `text`、`status`、`amount`、`datetime`。
- 所有键值型详情字段必须由 Ant Design Vue 的 `a-descriptions` 与
  `a-descriptions-item` 渲染；不得用 CSS Grid、`div` 行列或自绘表格模拟描述列表。固定使用
  原生无边框、三列、`size="small"` 的 Descriptions，间距、列宽和断点由 Ant 组件控制，不覆写
  其单元格样式。
- 常规详情固定三列；字段使用 `span: 1 | 2 | 3 | full`。长地址、证件串、备注和复杂值优先
  跨两列或整行，并放在该组后部。
- 字段 label 与值左对齐，不把单字段拆成独立小卡片。信息组直接由标题、留白和轻分隔线组织；
  禁止在 `Descriptions` 或从属表外再套 `Card`。
- `format: status` 必须声明 `tone: default | success | error | warning | processing`，由 Ant Badge
  负责点和颜色。

### 从属明细表

```yaml
detail:
  groups:
    - key: refund
      title: 退款信息
      fields: []
      table:
        rowKey: refundId
        columns:
          - { key: refundNo, label: 退款请求号 }
          - { key: amount, label: 退款金额(元), format: amount, currency: CNY }
        rows: []
```

- 组内 `table` 需要 `detail.embeddedTable`。它只承载当前对象的退款、日志、明细等从属数据。
- 从属表固定无筛选、无分页、无批量选择、无嵌套展开、无行跳转；一旦需要这些能力，应拆为
  独立 `list` 页面。

### 摘要与动作

- `detail.metrics` 最多 4 项，只用于经营数量、关键金额等用户需要先判断的摘要；不能取代
  基础字段，也不作为装饰卡片。
- `detail.actions` 只用于页面级查看后动作。多个次操作与主操作需有明确业务去向；编辑主操作
  的目标应为独立 `form` 页面。

## 3. 布局与响应式

- 内容面有一个主任务区时为整块白底；锚点型超复杂详情固定为“左侧白色导航卡 + 右侧一整块白色主内容面”。右侧内部的独立信息组使用标题、24px 留白和轻分隔线组织，不把每个信息组拆成卡片。Drawer 是例外：组间与标题下不使用横线，Footer 操作右对齐。
- 快捷 Modal 使用 Ant 原生 Header 与 Footer，宽度为 860px；内容区不嵌套 Card，直接呈现三列
  Descriptions，关闭按钮沿用 Modal Footer 的默认右对齐。
- 锚点页为“左侧窄导航 + 右侧分组内容”，导航固定在可视区域；960px 以下改为内容上方导航。
- Tabs 页在当前标签内只呈现一个信息组；Tabs 不是 Shell Tab 的替代物。
- 680px 以下详情字段改为单列自然流式布局，长值不溢出或缩小字号。

## 4. 禁止事项

- 禁止把可独立查询、筛选或批量处理的数据塞进详情内嵌表。
- 禁止同时使用锚点与 Tabs。
- 禁止因为字段多就默认使用 Tabs；信息组连续相关时使用锚点，独立时才使用 Tabs。
- 禁止在 Detail Modal 中出现滚动长页或多层 Drawer；复杂查看使用 Drawer 或独立页。
- 禁止在快捷 Modal 内嵌套 Card、重复显示单一信息组标题，或将无边框 Descriptions 改为表格化边框。
- 禁止在任何详情展示形态中为 `Descriptions` 或从属表额外套用 `Card`。
- 禁止绕开 `a-descriptions` 手写键值信息区，或以样式覆盖、伪造另一套描述组件。
- 禁止沿用上一页面的导航、信息组、数据或输出目录。
