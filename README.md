# 老板管账后台原型 PoC

这是一个基于 OpenDesign 的企业后台高保真原型工作台。它把产品自然语言需求转换为受设计规范、固定 Shell 和页面模式约束的 HTML 原型。

## 目标

```text
业务自然语言需求
  -> Feature Spec（多页面与流程审核）
  -> Page Spec（单页骨架、能力、状态）
  -> #page-content.html
  -> 固定 Shell 注入
  -> preview.html
```

业务人员不需要选择“列表页、表单页还是详情页”。需求理解 Agent 负责判断页面类型、菜单位置、路由、操作流转和页面能力；生成 Agent 只根据已审核的 Spec 落地内容区。

## 核心边界

### 固定 Shell

由工程统一维护，AI 不得自由生成或修改：

- 一级导航、二级菜单、TopBar、顶部标签、页脚。
- 菜单点击后打开/激活标签、标签关闭、刷新、右键操作等通用交互。
- PC Shell 的响应式策略、全局工具和视觉规范。

三级菜单对应页面默认打开或激活标签；弹窗、抽屉和结果状态默认不创建新标签。这个规则属于 Shell，不需要业务人员每次描述。

### 可变内容区

AI 只输出：

```html
<section id="page-content" class="page">
  ...业务内容...
</section>
```

内容区使用“页面骨架 + 内容能力 + 交互状态 + 业务数据”的方式生成，避免为每一种相似页面复制一套模板。

## 内容模式

完整目录见 [内容模式目录](specs/content-pattern-catalog.md)。

| 页面骨架 | 典型能力 |
| --- | --- |
| `list` | 基础/高级查询、统计、指标、表格、批量操作、展开子表、列控制、分页 |
| `form` | 简单/分组/分步表单、上传校验、草稿、确认、粘性操作栏、结果流转 |
| `detail` | 快速查看、分组字段、锚点或区段标签、关键摘要、内嵌表格 |
| `result` | 成功、失败、警告、处理中、结构化结果摘要、后续动作 |
| `home` | 后续单独建设首页模式，不与业务内容页面混用 |

每个页面在生成 HTML 前必须声明：

```yaml
page:
  family: list
  presentation: page
content:
  capabilities: [query.advanced, table.flat, table.pagination]
  states: [loading, empty, error]
```

能力组合与禁止组合由内容模式目录约束，例如：没有批量动作不能出现选择列；锚点导航与区段标签不能同时出现；复杂表单不能塞进列表主体。

## 多页面功能包流程

一次业务需求涉及菜单、列表、新增、详情、结果等多个页面时，使用 `skills/admin-feature-pack/SKILL.md`。

### 阶段一：理解与审核

输出：

1. 功能摘要。
2. 页面清单：菜单、路由、入口、是否打开标签。
3. `feature-spec.yaml`。
4. 假设与待确认项。

此阶段不生成 HTML。产品确认“页面是否齐全、菜单位置是否正确、每个动作去哪里”后，才进入下一阶段。

### 阶段二：批量生成

输出目录：

```text
features/<feature-id>/
  feature-spec.yaml
  menu-change.yaml
  pages/
    <page-id>/
      page-spec.yaml
      page-content.html
```

每个页面只生成内容区；`preview.html` 始终由固定 Shell 注入生成。

## 单页生成流程

单页或“列表 + 新增/详情/结果”等局部流程，使用 `skills/admin-query-flow/SKILL.md`：

1. 理解自然语言需求。
2. 输出 Page Spec。
3. 根据内容模式选择合法能力组合和局部模板。
4. 输出 `page-content.html`。
5. 通过固定 Shell 生成 `preview.html`。
6. 输出自检清单。

## 表单配图与资产

`form.illustration` 是可选能力，只适用于少量字段、且说明图确实能帮助填写的简单表单。初期不需要人工准备图片：

1. Page Spec 写明 `assetKey`、用途和画面主题。
2. 页面先使用 `templates/partials/form/illustration.template.html` 的统一占位。
3. 确认页面结构后，再由 OpenDesign 生成同主题插图。
4. 用生成资产的真实 `src` 替换占位，不改变表单结构和布局。

插图在窄屏隐藏；不得使用照片、营销风格大图或与系统色彩冲突的素材。

## 目录说明

```text
design-system/  视觉规范、Design Token、组件样式
shell/          固定后台 Shell、菜单配置和全局交互
templates/      页面兼容模板、Feature Spec 模板、可组合局部模板
skills/         OpenDesign 可调用的页面/功能包生成 Skill
specs/          Page Spec、Feature Spec、内容模式与页面规则
prompts/        可直接用于 OpenDesign 的验证提示词
qa/             内容区和 Shell 的人工审核样例
tools/          内容区注入固定 Shell 的预览构建工具
assets/         Logo、插图等已确认资产
```

推荐先使用 `prompts/content-pattern-validation.md` 验证复杂业务需求的拆解与批量生成流程。

完整的阶段规划、验收门槛、角色边界和多端扩展策略见 [演进路线图](docs/evolution-roadmap.md)。

## 预览

`preview.html` 是生成产物，不应手工编辑。编辑 Shell、菜单、样式或内容区时，使用监听模式：

```bash
node tools/build-preview.mjs qa/shell-preview-content.html preview.html --watch
```

然后刷新浏览器即可看到更新后的固定 Shell 与内容区。

## 验收标准

- 需求可被拆为可审核的 Feature Spec 和 Page Spec。
- AI 只生成内容区，不重画 Shell。
- 页面能力组合、状态和业务流程闭环符合规则。
- 视觉保持红橙主色、浅灰页面背景、白色内容卡片和紧凑后台密度。
- 产品、UI、前端能够分别审核需求、视觉和可交付 HTML。
- 通过真实业务案例验证后，再将案例沉淀为新增模式或局部模板。
