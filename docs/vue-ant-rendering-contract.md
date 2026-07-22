# Vue / Ant Rendering Contract

## Purpose

This contract defines the required Vue and Ant Design Vue rendering path for
the fixed `admin-pc-ant` Shell. New pages do not have a hand-written HTML
fallback.

The canonical business artifact is `page-spec.yaml`. `page-content.html`,
`checklist.md`, and `preview.html` are deterministic derived artifacts.

```text
Business requirement -> Page Spec v2 -> build-vue-ant-page
                     -> page-content.html + checklist.md + preview.html
```

## Required Page Spec

Every new page must declare:

```yaml
ui:
  platform: admin-pc-ant
  runtime: vue-ant
  rendererVersion: 2
```

Every new `form` page must also declare a machine-readable template choice:

```yaml
template:
  id: form.single-stage
```

Supported form template IDs are `form.single-stage`, `form.grouped-configuration`,
`form.staged-configuration`, and `form.import-review-flow`. The MCP write tool
rejects a new form Page Spec without this declaration. Older v2 artifacts may still
be rebuilt through capability-based inference until they are regenerated.

The renderer supports `form`, `list`, `detail`, and `result`. `detail` and
`result` are currently in POC acceptance: their renderer mappings are complete,
but the fast business entry stays closed until visual acceptance. The page family
still selects its Context Pack; the runtime only owns component behavior.

## Output Boundary

`tools/render-vue-ant-page.mjs` writes exactly one content root:

```html
<section id="page-content" class="page" data-runtime="vue-ant">
  <div data-admin-pc-vue-root></div>
  <script type="application/json" data-admin-pc-vue-page>{...}</script>
</section>
```

No page-level JavaScript, CSS, Shell markup, iframe, or arbitrary Vue template
is emitted. The fixed runtime parses the JSON declaration, mounts the Vue app,
and renders approved Ant components.

## Shared CSS Isolation

The preview is one document: the Shell, legacy static surfaces and Vue / Ant
components share the same CSS cascade. Shared design-system CSS must never use
bare native selectors such as `button`, `input`, `select`, `textarea`, `table`,
`thead`, `tbody`, `tr`, `th` or `td`, because Ant components render those DOM
elements internally. Static rules must be scoped to their owned container, for
example `.table-scroll > table`. Runtime CSS may style owned wrapper classes but
must not override `ADescriptions` internals; its table layout and responsive
behavior belong to Ant. `npm run build:vue-ant-runtime` rejects either violation
before it creates a runtime bundle, and every preview build runs the same gate
before it writes `preview.html`. `npm run test:css-isolation` includes unsafe CSS
fixtures so this boundary is tested rather than documented only.

## Build Command

Once the AI has written a complete Page Spec, it must use the single relative
path command below from the current project root:

```bash
node tools/build-vue-ant-page.mjs \
  outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/page-spec.yaml \
  outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/page-content.html \
  outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/checklist.md \
  outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/preview.html
```

The command renders the content declaration, validates it against the supplied
Page Spec, builds the fixed-Shell preview, and writes the checklist. It refuses
absolute paths so an OpenDesign task cannot silently build against another
project root.

## Declarative Responsibilities

| Layer | Owns |
| --- | --- |
| Page Spec | business labels, fields, options, data, rules, actions, state transitions |
| Renderer | Page Spec validation and conversion to the browser declaration |
| Vue/Ant runtime | Select, Radio, Form, Table, Pagination, Modal, Drawer, Descriptions, Anchor, Tabs, Result, focus, keyboard and component state |
| Context Pack | page-family choice, layout capability, semantic component selection |
| Design system | Token mapping, page layout, Shell and shared visual language |

The AI must not generate arbitrary Vue methods, directives, imports, component
props, or local component CSS. Business effects are declared as data.

## Supported Form Declaration

`form.fields`, `form.groups`, `form.steps`, `form.actions`, and `form.submit`
remain the source of truth. The current renderer maps `static`, `input`,
`select`, `radio`, `upload`, `Tabs`, `Steps`, `Card`, `Table`, `Alert`, `Result`
and sticky action bars from structured declarations. Vue pages additionally use
explicit machine-readable behavior rather than natural-language parsing:

```yaml
form:
  interactions:
    - on: settlementMode
      effect: clear-editable-fields
  submit:
    disabledUntil: [bankAccountType, legalPerson, accountName, bankAccountNumber]
    validationMode: form-rules
    failureSimulation:
      field: bankAccountNumber
      endsWith: '0'
```

`illustration.copy` may provide a title and short description while an approved
asset is unavailable. The actual image asset remains a separate registered
asset concern.

Complex forms use `form.groups` rather than arbitrary markup:

```yaml
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
        - { key: registeredAddress, label: 注册地址, control: input, required: true, span: 2 }
    - key: settlement
      title: 结算信息
      fields:
        - { key: settlementAccount, label: 结算账户, control: input, required: true }
```

`form.groups` requires at least two groups, `fieldLayout: multi-column`,
`columns: 2|3|4`, `form.stickyActions`, and `actions.placement: sticky-end`.
It cannot be combined with `form.sideIllustration` or `form.modeTabs` in the
current renderer. The runtime presents group fields vertically within a
responsive Ant Card grid and scrolls to the first invalid field on submission.

Batch import uses `form.uploadFlow`: at least three declared Steps, an upload
field, a read-only review table, bottom confirmation actions, and a result
summary. It requires the capabilities `form.steps`, `form.upload`,
`form.reviewTable`, `form.uploadFlow`, and `form.stickyActions`. The flow stays
inside the current form route and does not generate a separate Shell page.

## Supported Detail Declaration

Details use a structured group array, not arbitrary definition-list HTML:

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

The renderer maps `detail.groups` directly to Ant `Descriptions` and optional
read-only `Table` content; it does not wrap detail groups in `Card` surfaces.
`detail.quickView` is restricted to Modal or Drawer. `detail.anchors` and
`detail.sectionTabs` are mutually exclusive page-only navigation patterns.
An embedded table is read-only and must belong to a declared detail group.

## Supported Result Declaration

```yaml
page:
  family: result
  presentation: page
content:
  capabilities: [result.basic, result.summary]
result:
  source: 分账批量复核流程
  status: success
  title: 复核成功
  description: 稍后即可在转账记录中查看资金到账情况。
  actions:
    primary: { key: continueReview, label: 继续复核 }
  summary:
    items:
      - { key: reviewedCount, label: 复核通过, value: 共1笔 }
      - { key: reviewedAmount, label: 复核通过金额, value: 共10.00元 }
```

`result.basic` is mandatory. `result.summary` has 2 to 6 items, and
`result.feedback` is permitted only for success results. Error results require
at least one recovery action.

## Supported List Declaration

The existing `query`, `table`, and `content.states` sections remain the source
of truth. Vue list pages need structured prototype rows because the renderer
does not infer data from prose. The supported list semantics are declared by
capability: basic or advanced query, date range and quick ranges, count/amount
summary, standard or rich statistics cards, toolbar actions, link/tag/status/
amount columns, fixed row actions, Popconfirm, export, refresh, column settings,
client-side pagination, and one-level parent-row expandable child tables.

The renderer places the query action group (`收起/展开` when present, `重置`,
`查询`) as the final item of the same responsive query grid as the conditions.
It occupies the rightmost column of the final occupied row: an incomplete row
keeps the actions on its right; a full row causes the actions to start the next
row at the right. This applies at the 3-column desktop, 2-column tablet and
1-column mobile breakpoints without Page Spec overrides.

When `query.quickRanges` is declared, it owns exactly one date-range field. The
runtime renders the RangePicker and quick dates as one horizontal time condition
group, gives that group a dedicated query row, and starts all other conditions on
the following row. Without `query.quickRanges`, a date-range remains an ordinary
field and follows its declared `span`.

```yaml
table:
  rowKey: ruleId
  columns:
    - { key: ruleName, label: 规则名称, format: link }
    - { key: actions, label: 操作, fixed: right, required: true }
  rowActions:
    - { key: invalidate, label: 失效, confirm: 确认将该规则置为失效？ }
  rows:
    - ruleId: R001
      ruleName: 连锁门店分润
  pagination:
    total: 8
    page: 1
    pageSize: 20
    pageCount: 1
```

Rows may contain an `actions` array for row-specific action availability.
For the current client-side renderer, `pagination.total` must equal the number
of supplied rows. The detailed Page Spec schema and capability combinations are
defined in `context-packs/admin-pc-ant-list.md`; a business page must not expose
raw Ant props or mimic unsupported tree rows, nested expansion, or remote data.

`statistics` is separate from the table-toolbar `summary`. It contains 3 to 5
cards and uses `layout: standard` for title/value cards or `layout: rich` when
cards include detail text or a structured action. Each metric has exactly one
numeric source: a literal `value`, or an `aggregate` over the currently applied
query rows. Amounts always render with grouping and two decimal places; counts
render with grouping and no decimal places.

`table.selection` and `table.batchActions` are a paired client-side capability.
They render a fixed Ant multiple-selection column, four selection shortcuts,
disabled batch buttons before any selection, a selected-count status bar, and
Ant Popconfirm for declared dangerous batch actions. Selection persists while
the current client-side result pages change, then clears when query or reset
changes the result set. Server-side pagination and unloaded-record selection are
not part of this capability.

`table.expandable` renders a one-level, read-only child Ant Table from a parent's
declared child-row array. Every parent starts collapsed; multiple parents may be
expanded at once. Empty child arrays do not expose an expand control. Applying or
resetting a query clears expansion; paging within the same client-side result set
preserves it. The first slice explicitly excludes child pagination, nested expansion,
child selection/batch operations, child actions, and combining expansion with parent
selection.

## Runtime Availability

`ant-design-vue` and `@ant-design/icons-vue` are installed as fixed project
dependencies. The project can use the full Ant component inventory, while the
first renderer exposes only components with an approved semantic mapping. New
components are added to the renderer and Context Pack after a representative
page validates their layout and business behavior.

The preview bundle imports only the components used by the renderer so generated
previews remain reasonably small. The source dependency remains the full Ant
library; adding a supported component does not require a new UI library.

## Runtime Policy

- `ui.runtime: vue-ant` is mandatory for all new `form`, `list`, `detail`, and
  `result` pages once their Context Pack is marked available.
- The static checker rejects hand-written content controls, page scripts and
  local page styles.
- Existing legacy files are historical references only. They are not accepted
  by the current checker or preview builder.
- A business capability that is not yet in the renderer must be added as a
  semantic renderer mapping. It must not be emulated with static HTML.
