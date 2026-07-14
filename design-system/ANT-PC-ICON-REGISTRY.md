# PC Ant 图标语义表

本表只适用于 `admin-pc-ant`。图标来源固定为 Ant Design Icons 官方 SVG 资产，后续由框架统一登记和加载。页面生成 Agent 使用语义名，不自行绘制 SVG。

| 语义名 | Ant Design Icons | 场景 |
| --- | --- | --- |
| `down` | `DownOutlined` | Select、折叠、下拉菜单 |
| `up` | `UpOutlined` | 收起、向上展开 |
| `left` | `LeftOutlined` | 上一页、返回 |
| `right` | `RightOutlined` | 下一页、前进 |
| `close` | `CloseOutlined` | 关闭标签、关闭浮层 |
| `search` | `SearchOutlined` | 查询输入、查询动作 |
| `reload` | `ReloadOutlined` | 刷新、重试 |
| `calendar` | `CalendarOutlined` | 日期/日期时间选择器 |
| `info-circle` | `InfoCircleOutlined` | 指标口径、辅助说明 |
| `question-circle` | `QuestionCircleOutlined` | 帮助入口 |
| `setting` | `SettingOutlined` | 列设置、配置 |
| `download` | `DownloadOutlined` | 下载、导出 |
| `upload` | `UploadOutlined` | 上传 |
| `filter` | `FilterOutlined` | 表格筛选 |
| `ellipsis` | `EllipsisOutlined` | 更多操作 |
| `check-circle` | `CheckCircleFilled` | 成功结果 |
| `close-circle` | `CloseCircleFilled` | 失败结果 |
| `exclamation-circle` | `ExclamationCircleFilled` | 警告、危险确认 |
| `loading` | `LoadingOutlined` | 加载状态 |

## 使用规则

- 以 `data-icon` 或固定 `ui-icon` 组件引用语义名，例如 `data-icon="calendar"`。
- 图标颜色继承所在组件语义，不在页面中硬编码蓝色、绿色或红色。
- 图标尺寸由组件决定，常用尺寸为 14px、16px、18px、20px；不能在页面任意缩放。
- 如果图标语义不在表中，先新增语义并由 UI 审核，不得寻找近似 Emoji 或手绘图标替代。
