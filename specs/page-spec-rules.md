# Page Spec 规则

需求理解 Agent 必须先把产品自然语言转换成 Page Spec，再交给落地 Agent 生成 HTML。

## 必填信息

- `app.module`：业务模块，例如交易中心。
- `app.menuPath`：菜单路径，必须能映射到左侧菜单。
- `mainPage.type`：主页面类型。
- `search.fields`：查询条件。
- `table.columns`：表格列。
- `primaryActions`：页面主操作。
- `interactions`：弹窗、抽屉、结果页等子交互。
- `shell.activePrimary`：当前一级菜单。
- `shell.activeSecondary`：当前二级菜单。
- `shell.tabs`：当前打开的顶部 Tabs。
- `page.family`：内容骨架，取值为 `list`、`form`、`detail`、`result` 或 `home`。
- `page.presentation`：展示形式，取值为 `page`、`modal`、`drawer` 或 `inline-state`。
- `content.capabilities`：从内容模式目录选择的能力集合。
- `content.states`：页面必须覆盖的基础状态。
- `ui.platform`：当前 PC 页面必须为 `admin-pc-ant`；移动端采用独立平台契约。

内容骨架、能力、状态和组合限制必须遵循 `content-pattern-catalog.md`。不要从页面名称直接推导模板；先判断用户要完成的任务和流程位置。

## 页面类型判断

- 出现“查询、筛选、结果列、列表、分页”：主页面为 `list`。
- 出现“新增、编辑、填写、提交”：增加 `modalForm`、`drawerForm` 或 `formPage`。
- 出现“查看、详情、基本信息、分组信息”：增加 `detail`。
- 出现“成功、失败、处理中”：增加 `result`。
- 出现“待办、快捷导航、通知、数据概览”：主页面为 `home`。

## 默认补全

如果产品未说明：

- 分页：默认开启。
- 空状态：默认补充。
- 加载态：默认补充。
- 表格操作列：默认在最右侧。
- 主按钮：默认在表格卡片右上角。
- 提交成功：默认进入成功结果页或关闭弹窗并刷新列表，优先根据需求上下文判断。
- 危险操作：默认要求二次确认。
- 所有数据页：默认补充加载、无数据和错误状态。

## 不确定时再追问

只有关键业务信息缺失时才追问，例如：

- 菜单路径完全缺失。
- 表单字段完全未给。
- 表格列完全未给。
- 提交后流程有明显冲突。

其他轻微缺失可以先按默认规则补齐，并在 `assumptions` 中说明。

## Shell 处理规则

Shell 不属于业务页面内容，不能由 AI 自由生成。

需求理解 Agent 只需要把菜单信息转换为结构化字段：

```yaml
shell:
  activePrimary: 交易
  activeSecondary: 余额分账规则设置
  tabs:
    - 首页
    - 我的账号
    - 我的账号
    - 余额分账规则设置
```

落地 Agent 使用 `shell/menu.config.yaml` 和 `shell/app-shell.html` 固定渲染框架。

AI 生成页面时默认只输出：

```html
<section id="page-content" class="page">
  ...
</section>
```

## 内容模式引用

Page Spec 生成后，按页面骨架读取对应规则：

- `list`：`list-pattern-rules.md`
- `form`：`form-pattern-rules.md`
- `detail`：`detail-pattern-rules.md`
- `result`：`result-pattern-rules.md`

`capabilities` 必须与 `family` 匹配，且必须通过目录中的允许/禁止组合校验。

PC 页面生成时还必须遵循 `design-system/ANT-PC-COMPONENT-CONTRACT.md` 和 `design-system/ANT-PC-ICON-REGISTRY.md`。

如果需要完整预览，只能把内容区注入固定 Shell，不允许生成第二套 Shell。
