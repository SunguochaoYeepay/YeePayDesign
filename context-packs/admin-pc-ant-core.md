# Admin PC Ant Core Context Pack

适用平台：`admin-pc-ant`，仅限老板管账 PC 后台主内容区。

## 固定运行模型

所有新页面必须使用固定 Vue / Ant Design Vue 渲染器。业务 Agent 只生成
`page-spec.yaml`，不得手写 HTML 控件、Vue 模板、JavaScript、局部 CSS、Shell
或 iframe。

```text
业务需求 -> Page Spec v2 -> tools/build-vue-ant-page.mjs
         -> page-content.html + checklist.md + preview.html
```

- Page Spec 必须声明：

  ```yaml
  ui:
    platform: admin-pc-ant
    runtime: vue-ant
    rendererVersion: 2
  ```

- `page-content.html` 是由固定工具生成的派生产物，根节点固定为
  `<section id="page-content" class="page" data-runtime="vue-ant">`。
- 运行层加载固定版本的完整 `ant-design-vue` 依赖；组件的展开、键盘、焦点、
  表单校验、弹窗、表格和分页行为由 Ant 负责。
- `component-runtime.js` 与 `ui-*` 原生控件结构不再用于新页面。历史 HTML
  仅作归档，不属于生成、校验或预览路径。

## 固定边界

- 禁止生成或重画菜单、TopBar、Tabs、页脚、`body`、`head` 或完整 Shell。
- 完整预览只允许通过固定构建器生成；构建器注入真实 Shell、Token、Ant Vue
  运行时和全局交互。
- 快速入口开始前，当前工作目录必须可读 Token、组件样式、图标精灵、Shell、
  Vue/Ant 运行资源、页面构建工具、契约工具与 Context Pack，并可写入当前项目。
  关联的只读参考项目不能替代这些运行文件。
- 页面外层留白固定为 `16px`。运行层根据任务块数量决定内容面：只有一个主任务区时，
  整块内容面为白色；有两个或更多彼此独立的任务块时，内容区使用
  `rgba(0, 0, 0, 0.04)` 承载面，白色仅用于各任务块，块间 16px 间距露出灰色底面。
  业务 Agent 不在 Page Spec 中指定背景或局部样式。

## 语义组件规则

- Page Spec 描述业务语义，例如 `select`、`radio`、`input`、`table`、`pagination`
  和 `modal`，由渲染器映射为 Ant 组件。
- 不在 Page Spec 中暴露任意 Vue 指令、组件 import、事件处理函数或复杂 Ant
  底层 props。
- Ant 组件库完整安装在框架中；当前渲染器仅启用经验证的语义映射。需求需要新
  控件时，先扩展渲染器与对应 Context Pack，不能以 HTML/CSS 伪造。
- 图标由渲染器使用固定 Ant 图标包；Shell 图标继续使用本地 SVG 精灵。

## 状态与可访问性

- Page Spec 声明 `loading`、`empty`、`error` 等业务状态；默认视图不预先显示。
- 必填、格式和提交前错误必须定位到具体字段；提交失败保留已填内容。
- 业务副作用使用结构化声明，例如表单字段切换后清空、四要素失败条件、查询
  应用时机和危险操作确认，不在页面中写事件脚本。

## 输出与完成条件

- 输出目录：`outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/`。
- 必须生成 `page-spec.yaml`、`page-content.html`、`checklist.md`、`preview.html`。
- Page Spec 完整后，从当前项目根目录运行唯一构建命令：

  ```bash
  node tools/build-vue-ant-page.mjs \
    outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/page-spec.yaml \
    outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/page-content.html \
    outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/checklist.md \
    outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/preview.html
  ```

- 该命令会渲染内容区、校验 Page Spec 与产物一致性、构建预览并生成检查清单。
  任一步失败即为构建阻断，不得伪造或报告 `preview.html` 已完成。
- 禁止浏览器目视检查、截图比较、互评审、审美打分和无明确结束条件的自主迭代；
  预览由用户验收。
