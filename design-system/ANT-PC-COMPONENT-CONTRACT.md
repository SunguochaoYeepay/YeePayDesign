---
platform: admin-pc-ant
scope: pc-content-area
reference: Ant Design v5 component semantics and Ant Design Icons
---

# PC Ant 组件契约

本规范只适用于老板管账 **PC 后台内容区**。它定义后台原型中基础控件的视觉、状态、结构和交互边界，使 OpenDesign 生成页面时遵循 Ant Design 的组件语义，而不是模拟浏览器原生控件。

本规范不适用于 `mobile-h5`、小程序和原生 App。未来移动端应拥有独立的组件契约，例如 `mobile-h5-vant`；只能共享业务 Feature Spec，不能共享 PC 的控件结构、尺寸、导航和手势规则。

## 1. 强制规则

- 每个 PC Page Spec 必须声明 `ui.platform: admin-pc-ant`。
- 生成前必须读取本文件、`ANT-PC-ICON-REGISTRY.md` 和 `templates/primitives/admin-pc-ant/`。
- 使用 `tokens.css` 中的变量；PC 默认控件高度为 `40px`，默认圆角为 `4px`。
- 页面只能组合本规范中的基础控件。禁止为单个业务页面重新定义下拉、单选、步骤条、日期选择器、Tooltip 或状态组件的视觉语义。
- 图标只能按图标语义表引用 Ant Design Icons；禁止使用文字 `i`、Unicode 符号、Emoji 或手绘 SVG 代替系统图标。
- 只有业务差异可以在 `#page-content` 写局部样式；基础控件的颜色、状态和交互规则不得覆盖或改写。

## 2. Token 映射

| Ant 语义 | PC 后台映射 |
| --- | --- |
| `colorPrimary` | `var(--color-primary)`，当前为红橙主色 |
| `colorError` | `var(--color-error)` |
| `colorSuccess` | `var(--color-success)`，仅用于业务成功状态 |
| `colorWarning` | `var(--color-warning)` |
| `controlHeight` | `var(--control-height)`，当前为 40px |
| `borderRadius` | `var(--radius-md)`，当前为 4px |
| `colorBorder` | `var(--border-strong)` |
| `colorText` | `var(--text-title)` |
| `colorTextPlaceholder` | `var(--text-muted)` |

禁止把信息蓝作为 Radio、Checkbox、Steps、Select 的默认激活色。它们的激活态统一使用主色。

## 3. Select

使用场景：单选枚举、可搜索枚举、远程搜索。

- 使用 `ui-select` 结构和 `DownOutlined` 图标。
- `default`、`hover`、`focus`、`disabled`、`error`、`open`、`clearable` 状态必须一致。
- 默认文本为“全部”或明确 placeholder；不得把浏览器原生箭头作为视觉实现。
- `remote-search` 必须有 loading、无结果、错误和清空语义。
- 禁止直接输出未包装的 `<select class="control">` 作为最终 PC 视觉控件。

参考：`templates/primitives/admin-pc-ant/form-controls.template.html`。

## 4. Radio 与 Checkbox

- Radio 和 Checkbox 均使用主色作为 `checked` 状态，禁止浏览器默认蓝。
- 必须表达 `default`、`hover`、`checked`、`disabled`、`error`；禁用态不可误导为可点击。
- 单选组使用 `ui-radio-group`，选择不超过一项；多选使用 `ui-checkbox-group`。
- 必填是字段规则，不是 Radio 本身的颜色规则；红色星号只出现在 label。

参考：`templates/primitives/admin-pc-ant/form-controls.template.html`。

## 5. Steps

步骤条只用于存在明确顺序和前后依赖的流程。

| 状态 | 颜色与表达 |
| --- | --- |
| `wait` | 辅助文字与灰色边框 |
| `process` | 主色圆点/编号与主色标题 |
| `finish` | 主色完成图标与主色标题，不使用成功绿 |
| `error` | 错误色，提供明确错误说明 |

- 业务“提交成功”才使用成功绿；步骤完成不是业务成功。
- 步骤条默认不允许跳步；只有 Spec 声明可回退时才显示“上一步”。
- Step 标题、描述、连接线和状态必须由 `ui-steps` 统一控制。

参考：`templates/primitives/admin-pc-ant/steps.template.html`。

## 6. DatePicker 与 DateTimePicker

- 禁止将浏览器原生 `input[type=date]` 或 `input[type=datetime-local]` 作为最终可见控件，因为浏览器日历、箭头、颜色和排版不可控。
- 使用 `ui-date-picker`、`CalendarOutlined` 和统一的日期面板。
- Page Spec 必须声明 `format`、`showTime`、`allowClear`、`disabledDate`（如有）和默认值来源。
- 日期面板包含：年月切换、日期网格、今天、清除；`showTime: true` 时增加统一时间选择区。
- 输入值格式：日期 `YYYY-MM-DD`；日期时间 `YYYY-MM-DD HH:mm:ss`。禁止浏览器本地化格式混入原型。

参考：`templates/primitives/admin-pc-ant/date-picker.template.html`。

## 7. Tooltip、图标和说明

- 仅对不易理解的图标、被截断文本、指标口径使用 Tooltip。
- 指标说明使用 `InfoCircleOutlined`，不使用字母 `i`。
- Tooltip 只包含必要说明，不能承载关键业务操作。
- 所有图标从 `ANT-PC-ICON-REGISTRY.md` 以语义名引用。

## 8. Loading、Empty、Error、Result

- `loading`、`empty`、`error` 必须是互斥的内容状态，不得与真实表格、表单或详情主体同时展示。
- 所有状态容器必须支持 `[hidden]`，且 `hidden` 优先级高于组件默认 `display`。
- Loading 只能在 Page Spec 声明的加载阶段或测试状态出现；不得作为页面底部装饰或常驻内容。
- Error 必须给出可行动作，例如重试、返回修改、返回列表或下载错误明细。
- Result 使用 `success`、`error`、`warning`、`processing` 语义，不得只靠颜色区分。

参考：`templates/primitives/admin-pc-ant/state.template.html`。

## 9. Page Spec 写法

```yaml
ui:
  platform: admin-pc-ant

form:
  fields:
    - key: ruleStatus
      component: select
      icon: down
      states: [default, hover, focus, disabled, error]
    - key: settlementMethod
      component: radio-group
      states: [default, checked, disabled, error]
    - key: effectiveTime
      component: datetime-picker
      icon: calendar
      format: YYYY-MM-DD HH:mm:ss
      showTime: true
      allowClear: true
```

`control` 用于业务输入类型；`component` 用于 PC 视觉与交互组件。两者不可混淆。

## 10. 生成前自检

- 是否声明 `ui.platform: admin-pc-ant`。
- Select、Radio、Checkbox、Steps、DatePicker 是否使用规定组件，而不是浏览器原生视觉。
- 选中、完成、错误、成功等颜色是否符合语义。
- 图标是否全部来自官方 Ant 图标语义表。
- Loading、Empty、Error 是否互斥且可触发。
- 是否误把 PC 组件规则应用到移动端页面。
