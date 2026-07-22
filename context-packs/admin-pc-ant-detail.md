# Admin PC Ant Detail Context Pack

状态：**可用**。本包用于受控详情页面生成；页面字段、分组、明细表与动作必须由 Page Spec
声明，并固定由 Vue / Ant Design Vue 运行层渲染。

依赖：先读取 `admin-pc-ant-core.md`。适用 `family: detail` 的订单、账户、商户、规则和
处理记录查看。业务 Agent 只写 Page Spec，固定 Vue / Ant 运行层渲染 `Descriptions`、
`Table`、`Modal`、`Drawer`、`Anchor` 和 `Tabs`。

## 展示形式选择

| 业务证据 | Page Spec | 使用边界 |
| --- | --- | --- |
| 少量字段，快速核对，无关联明细 | `presentation: modal` + `detail.quickView + detail.groups` | 单一字段组；不滚动、不编辑、不放表格。 |
| 从列表连续查看，仍需保留列表上下文 | `presentation: drawer` + `detail.groups` | 可显示少量分组与从属明细表。 |
| 多组信息连续相关，需要多屏定位 | `presentation: page` + `detail.groups + detail.anchors` | 左侧 Anchor 定位与滚动同步。 |
| 信息组相对独立，需要切换查看 | `presentation: page` + `detail.groups + detail.sectionTabs` | 当前标签只显示一个信息组。 |

有编辑、配置、提交或复杂校验时，不在详情里追加表单；应进入单独 `form` 页面。

## 支持能力与限制

- `detail.groups`：所有详情的结构化信息组。字段使用 `key`、`label`、`value`，可声明
  `format: text | status | amount | datetime` 和 `span: 1 | 2 | 3 | full`；固定由
  Ant Design Vue `a-descriptions` / `a-descriptions-item` 输出，禁止手写键值栅格。
- `detail.quickView`：仅支持 `modal`、`drawer`；其中 `modal` 固定只有一个纯字段组，不显示组标题、组说明或内层 Card。
- `detail.anchors`：仅支持 `page`，至少两个信息组；不能与 `detail.sectionTabs` 同时声明。
- `detail.sectionTabs`：仅支持 `page`，至少两个信息组；不能与 `detail.anchors` 同时声明。
- `detail.metrics`：最多 4 项，仅支持 `page`，用于经营数量或关键金额等摘要。
- `detail.embeddedTable`：由某个 `detail.groups[].table` 声明。只读、无分页、无筛选、无批量操作、无嵌套展开。
- `detail.actions`：页面级有限动作；编辑动作必须转向独立 `form` 页面。

## 右侧抽屉映射

当需求表达“从当前列表查看记录”“右侧弹出详情”“保留来源页面”“关闭即可返回”时，使用：

- `page.family: detail` 与 `page.presentation: drawer`；运行层使用 Ant `a-drawer`，自带左侧遮罩和右上角关闭按钮。
- 每个业务信息模块映射一个 `detail.groups[]`；字段必须用 Ant `a-descriptions`，禁止手写键值布局或外套 Card。
- 从属只读明细映射为该组的 `table`，同时声明 `detail.embeddedTable`；状态列用 `format: status` 与 `statusMap` 输出 Ant 状态点。
- 底部确认或关闭动作声明为 `detail.actions.primary`。Drawer Footer 固定由 Ant Drawer 承载并右对齐；“我知道了”属于关闭动作，固定声明 `key: close`；业务明确要求红色强调时声明 `danger: true`，不追加表单或页面跳转。

## 规格示例

```yaml
page:
  family: detail
  presentation: page
ui:
  platform: admin-pc-ant
  runtime: vue-ant
  rendererVersion: 2
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

## 布局与交互

- 详情字段固定使用组件原生无边框 `a-descriptions` 三列、`size="small"`；label 与 value 左对齐，
  间距、列宽和响应式均交由 Ant 控制，不覆写描述单元格。长值跨列且不缩小字体。
- 锚点型超复杂详情使用“左侧白色导航卡 + 右侧一整块白色主内容面”；右侧的信息组仍直接由标题、24px 留白和轻分隔线组织，不为每个 `Descriptions` 或从属表套 Card，也不把单字段做成小卡片。Drawer 是例外：组间与组标题下不显示横线，只保留 24px 留白。
- Drawer 关闭后回到来源列表，Footer 内的关闭及后续操作统一右对齐；Modal 关闭后不应留下新的菜单或 Tab。快捷 Modal 使用原生 Header/Footer、860px 宽度，内容区直接呈现 Descriptions，不套 Card。
- 768px 以下自然收敛为单列信息流；Anchor 在窄屏不固定侧边。
- 截图仅表达布局和密度，禁止嵌入截图为详情内容。
