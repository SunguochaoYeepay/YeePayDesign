# PC Ant 图标语义表

本表只适用于 `admin-pc-ant`。图标来源固定为本地 Ant Design Icons 官方 SVG 精灵 `design-system/icons/ant/sprite.svg`。页面生成 Agent 使用语义名，不自行绘制 SVG、CSS 图形或文字图标。

| 语义名 | Ant Design Icons | 精灵符号 | 场景 |
| --- | --- | --- | --- |
| `down` | `DownOutlined` | `#down` | Select、折叠、下拉菜单 |
| `up` | `UpOutlined` | `#up` | 收起、向上展开 |
| `left` | `LeftOutlined` | `#left` | 上一页、返回 |
| `right` | `RightOutlined` | `#right` | 下一页、前进 |
| `close` | `CloseOutlined` | `#close` | 关闭标签、关闭浮层 |
| `search` | `SearchOutlined` | `#search` | 查询输入、查询动作 |
| `reload` | `ReloadOutlined` | `#reload` | 刷新、重试 |
| `calendar` | `CalendarOutlined` | `#calendar` | 日期/日期时间选择器 |
| `info-circle` | `InfoCircleOutlined` | `#info-circle` | 指标口径、辅助说明 |
| `question-circle` | `QuestionCircleOutlined` | `#question-circle` | 帮助入口 |
| `setting` | `SettingOutlined` | `#setting` | 列设置、配置 |
| `download` | `DownloadOutlined` | `#download` | 下载、导出 |
| `upload` | `UploadOutlined` | `#upload` | 上传 |
| `filter` | `FilterOutlined` | `#filter` | 表格筛选 |
| `ellipsis` | `EllipsisOutlined` | `#ellipsis` | 更多操作 |
| `check-circle` | `CheckCircleFilled` | `#check-circle` | 成功结果 |
| `close-circle` | `CloseCircleFilled` | `#close-circle` | 失败结果 |
| `exclamation-circle` | `ExclamationCircleFilled` | `#exclamation-circle` | 警告、危险确认 |
| `loading` | `LoadingOutlined` | `#loading` | 加载状态 |

## 使用规则

- 以空的 `ui-icon` 或 `ui-state-icon` 节点引用语义名，例如 `<span class="ui-icon" data-icon="calendar" aria-hidden="true"></span>`；`icon-runtime.js` 负责注入精灵 SVG。
- 图标颜色继承所在组件语义，不在页面中硬编码蓝色、绿色或红色。
- 图标尺寸由组件决定，常用尺寸为 14px、16px、18px、20px；不能在页面任意缩放。
- 禁止通过 `.ui-icon::before`、`[data-icon]::after`、CSS border/path 或文字内容绘制图标。
- 生成后必须运行 `node tools/check-pc-ant-icons.mjs <page-content.html>`；如果图标语义不在表中，先新增语义并由 UI 审核。
