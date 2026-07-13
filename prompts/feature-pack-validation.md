# 多页面功能包验证

## 阶段一：页面清单审核

```text
请使用当前工作目录中的以下文件理解老板管账后台固定框架和多页面功能包规则：

- design-system/DESIGN.md
- design-system/tokens.css
- design-system/components.css
- shell/app-shell.html
- shell/menu.config.yaml
- templates/feature-spec.template.yaml
- specs/feature-spec-rules.md
- specs/page-spec-rules.md
- skills/admin-feature-pack/SKILL.md
- skills/admin-query-flow/SKILL.md

这是一个多页面功能需求。现在只执行“阶段一：功能拆解与审核”，不要生成任何 HTML，不要修改 Shell，不要输出左侧菜单、顶部栏、Tabs 或页脚。

请输出：
1. 功能摘要
2. 页面清单表：页面名称、类型、入口、路由、是否标签页、呈现方式
3. feature-spec.yaml
4. assumptions 与待确认项

必须自动判断列表、表单、详情、结果、弹窗或独立页面；不要要求我选择页面类型。

我的需求是：
{{BUSINESS_REQUIREMENT}}
```

## 阶段二：确认后的批量生成

```text
已确认下面的 feature-spec.yaml。请执行“阶段二：批量页面生成”。

请读取：
- design-system/DESIGN.md
- design-system/tokens.css
- design-system/components.css
- shell/app-shell.html
- shell/menu.config.yaml
- templates/list.template.html
- templates/modal-form.template.html
- templates/detail.template.html
- templates/result.template.html
- specs/feature-spec-rules.md
- specs/page-spec-rules.md
- skills/admin-feature-pack/SKILL.md
- skills/admin-query-flow/SKILL.md

要求：
1. 为 feature-spec.yaml 中每个页面生成独立 `page-spec.yaml` 和 `page-content.html`。
2. 每个 page-content.html 只能生成 #page-content 内容区，禁止输出完整 HTML、body、head、菜单、TopBar、Tabs、页脚。
3. 生成 menu-change.yaml，描述菜单配置新增或修改建议；不要通过 HTML 重画菜单。
4. 每个可路由三级菜单默认由固定 Shell 打开或激活标签；不要在页面内容里实现标签栏。
5. 最后输出功能包自检清单。

feature-spec.yaml：
{{APPROVED_FEATURE_SPEC}}
```
