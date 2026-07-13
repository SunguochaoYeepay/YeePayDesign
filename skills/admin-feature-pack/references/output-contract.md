# Feature Pack Output Contract

阶段一只输出以下内容：

1. 功能摘要。
2. 页面清单表。
3. `feature-spec.yaml`。
4. 假设与待确认项。

阶段二按页面目录输出：

```text
features/<feature-id>/
  feature-spec.yaml
  menu-change.yaml
  pages/
    <page-id>/
      page-spec.yaml
      page-content.html
```

每个 `page-content.html` 必须是可注入 `#page-content` 的片段。预览通过 `tools/build-preview.mjs` 注入固定 Shell。

每个 `page-spec.yaml` 必须包含：

- `page.family`
- `page.presentation`
- `content.capabilities`
- `content.states`

能力必须来自 `specs/content-pattern-catalog.md`，且通过对应页面规则的组合校验。

禁止输出：完整 Shell、独立侧边栏、独立 TopBar、独立 Tabs、独立页脚。
