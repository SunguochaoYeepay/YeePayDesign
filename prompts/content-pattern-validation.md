# 内容模式验证提示词

将以下内容连同真实业务需求一起发送给 OpenDesign。

```text
请使用当前工作目录中的这些文件：

- design-system/DESIGN.md
- design-system/tokens.css
- design-system/components.css
- shell/app-shell.html
- shell/menu.config.yaml
- specs/feature-spec-rules.md
- specs/page-spec-rules.md
- specs/content-pattern-catalog.md
- specs/list-pattern-rules.md
- specs/form-pattern-rules.md
- specs/detail-pattern-rules.md
- specs/result-pattern-rules.md
- templates/feature-spec.template.yaml
- templates/partials/
- skills/admin-feature-pack/SKILL.md
- skills/admin-query-flow/SKILL.md

你是“需求理解与功能拆解 Agent”。请先处理下面的业务需求，但现在不要生成任何 HTML。

要求：
1. 不要求业务人员选择页面类型。根据需求推断每个页面的 page.family、page.presentation、content.capabilities、content.states。
2. 固定 Shell 负责一级/二级菜单、TopBar、Tabs、页脚和菜单打开标签规则；不得把它们作为业务页面重新设计。
3. 区分独立路由页面与弹窗、抽屉、结果状态。三级菜单对应页面默认 tab: true；结果页默认不新增菜单和标签。
4. 所有页面能力必须来自 content-pattern-catalog.md，并检查是否存在禁止组合。
5. 表单需要配图时，只声明 form.illustration 的 assetKey、purpose、theme 和 assetStatus: placeholder；不要现在生成图片，也不要使用无关图片代替。

本阶段输出顺序必须是：
1. 功能摘要。
2. 页面清单表：页面名称、路由、菜单位置、入口、family、presentation、是否打开标签、主要能力。
3. feature-spec.yaml。
4. 假设与待确认项。
5. 自检：路由唯一性、能力组合、状态完整性、流程闭环、Shell 边界。

停止并等待我的确认。没有我的确认，不要生成 page-content.html、preview.html 或完整 HTML。

我的业务需求是：
{{在这里粘贴真实业务需求}}
```

确认页面清单后，发送下面的第二阶段提示词。

```text
我已确认 Feature Spec。请进入批量页面生成阶段。

请根据已确认的 feature-spec.yaml：
1. 为每个独立页面生成 page-spec.yaml 和 page-content.html。
2. page-content.html 必须只输出 <section id="page-content" class="page"> 内容区，不得输出 html、head、body、Shell、菜单、TopBar、Tabs 或页脚。
3. 根据 page.family 和 content.capabilities 选择 templates/partials/ 中的局部模板；不得只套用一张固定整页模板。
4. 为 Page Spec 声明的 loading、empty、error 以及必要的 selected、success 等状态留下可实现结构。
5. 表单配图仍使用 form.illustration 占位；只有我明确提供或确认 OpenDesign 生成资产后，才使用真实图片路径。
6. 同时输出 menu-change.yaml 建议，以及功能包自检结果。

请按以下目录组织输出：
features/<feature-id>/
  feature-spec.yaml
  menu-change.yaml
  pages/<page-id>/page-spec.yaml
  pages/<page-id>/page-content.html
```
