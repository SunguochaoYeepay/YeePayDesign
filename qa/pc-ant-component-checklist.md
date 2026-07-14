# PC Ant 组件验收清单

适用平台：`admin-pc-ant`。移动端不使用本清单。

## 控件

- Select 是否使用统一箭头和打开态，而非浏览器原生箭头。
- Radio/Checkbox 选中态是否为主色，且禁用/错误状态清晰。
- Steps 的 `finish` 是否使用主色，未误用成功绿。
- DatePicker 是否使用 `CalendarOutlined` 和统一面板，未展示浏览器原生日历。
- Tooltip 是否使用 `InfoCircleOutlined` 等已登记图标，未使用文字 `i` 或 Emoji。

## 状态

- Loading、Empty、Error 是否与业务主体互斥。
- 所有带 `hidden` 的状态组件是否真的不占空间。
- Error 是否具备可执行的恢复动作。

## 图标与平台

- 所有图标是否均能映射到 `ANT-PC-ICON-REGISTRY.md`。
- Page Spec 是否标记 `ui.platform: admin-pc-ant`。
- 页面是否没有混入移动端尺寸、手势或 Vant 组件规则。
