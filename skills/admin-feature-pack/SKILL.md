---
name: admin-feature-pack
description: 将老板管账后台的一段自然语言业务需求拆解为可审核的多页面功能包，并在确认后批量生成固定 Shell 下的页面内容区。用于一个需求涉及菜单、路由、列表、表单、详情、结果页或跨页面流程时。
---

# Admin Feature Pack

将一个业务需求作为 Feature Pack 处理，而不是一次性生成多个彼此孤立的 HTML 文件。

## 必须读取

- `design-system/DESIGN.md`
- `design-system/tokens.css`
- `design-system/components.css`
- `design-system/ANT-PC-COMPONENT-CONTRACT.md`
- `design-system/ANT-PC-ICON-REGISTRY.md`
- `shell/app-shell.html`
- `shell/menu.config.yaml`
- `specs/feature-spec-rules.md`
- `templates/feature-spec.template.yaml`
- `specs/page-spec-rules.md`
- `specs/content-pattern-catalog.md`
- `skills/admin-query-flow/SKILL.md`

需要详细输出契约时，读取 `references/output-contract.md`。

## 两阶段流程

### 阶段一：功能拆解与审核

1. 从自然语言中识别业务目标、菜单变更、页面、路由、入口和页面间动作。
2. 推断页面类型：`list`、`form`、`detail`、`result`、`home`；不要要求业务人员选择类型。
3. 为每个页面写明 `page.family`、`page.presentation`、`content.capabilities`、`content.states` 与 `ui.platform`；当前 PC 功能包默认 `admin-pc-ant`，并根据内容模式目录检查组合是否合法。
4. 区分独立页面与同页状态：弹窗、抽屉、成功结果通常不是独立标签。
5. 按 `feature-spec-rules.md` 输出 `feature-spec.yaml` 和易读的页面清单。
6. 只在关键业务信息缺失时追问；其他缺失写入 `assumptions`。
7. 在产品确认前，禁止生成 HTML。

### 阶段二：批量页面生成

1. 只生成已确认 `pages` 中的页面。
2. 每个页面输出独立的 `page-spec.yaml` 和 `page-content.html`。
3. 复用 `admin-query-flow` 的列表、表单、详情和结果模板。
4. 根据 `family` 读取对应的页面规则、`templates/partials/` 局部模板和平台基础控件模板；PC 页面必须遵循 Ant 组件契约及图标语义，页面不是套用单一整页模板，而是按已确认的能力组合生成。
5. 页面内容只能写入 `#page-content`，不得重画 Shell、菜单、TopBar、Tabs 或页脚。
6. 对 `menuChanges` 生成菜单配置变更建议，但不得自由改写 `shell/app-shell.html`。
7. 每个可路由三级菜单默认打开或激活顶部标签；同一路由不得重复开标签。
8. 输出功能包自检：路由唯一性、入口完整性、能力组合、状态完整性、流程闭环、Shell 边界、视觉规范。

## 默认决策

- 点击三级菜单：`tab: true`。
- 新增/编辑：优先 `modal`；只有需求明确独立流程时使用 `page` + `tab: true`。
- 详情：可从列表行进入，默认独立路由和标签。
- 成功/失败：默认是当前页面状态，不新增菜单或标签。
- 关闭激活标签：由 Shell 自动激活左侧相邻标签。

## 输出边界

Feature Pack 负责描述菜单、页面和关系。固定 Shell 负责导航、TopBar、Tabs、响应式与全局工具。业务页面只负责内容区。
