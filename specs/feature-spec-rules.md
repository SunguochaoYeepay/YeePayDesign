# Feature Spec Rules

`feature-spec.yaml` 是一次多页面业务需求的唯一总入口。它先于页面 HTML 生成，并由产品确认。

## 必填字段

- `feature.id`：稳定的英文 kebab-case 标识。
- `feature.name`：功能中文名称。
- `feature.module`：所属业务模块。
- `menuChanges`：菜单新增、修改或无变更。
- `pages`：全部可见页面和独立路由页面。
- `flows`：跨页面或跨状态动作。
- `delivery.shell`：必须是 `fixed`。

## 页面规则

- `route` 在同一个功能包内唯一。
- `menuEntry: true` 只能用于三级菜单对应页面。
- `menuEntry: true` 默认要求 `tab: true`。
- `presentation: modal`、`drawer`、`inline-state` 不创建菜单，也不默认创建标签。
- `type: result` 默认使用 `presentation: inline-state` 或 `modal`。
- 详情页需要声明列表或其他入口。
- 同一个 `route` 被再次点击时激活已有标签，不重复创建。

## 审核规则

阶段一必须让产品能回答：

1. 页面是否齐全。
2. 菜单位置是否正确。
3. 点击“新增、查看、编辑、提交”分别去哪里。
4. 哪些是独立标签，哪些只是弹窗或状态。

没有确认前，不生成页面 HTML。

## 生成规则

- 单个页面仍遵循 `page-spec-rules.md`。
- 每个页面在生成 HTML 前必须声明 `page.family`、`page.presentation`、`content.capabilities` 和 `content.states`，并遵循 `content-pattern-catalog.md`。
- 页面只输出 `#page-content`。
- Shell、Tab、菜单、TopBar、页脚由固定框架维护。
- 菜单变更必须作为 `menu-change.yaml` 建议输出，不能通过页面 HTML 伪造菜单。
