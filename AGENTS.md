<!-- admin-pc-ant-policy:begin -->
# Admin PC Ant MCP 受控生成规则

本项目的页面族、模板、能力状态和 Page Spec 合法组合以 MCP 实时策略为唯一依据。不得依据旧对话、
截图、缓存、文档或本文件之外的页面族名单判断是否支持。

处理每个业务需求时，必须按以下顺序调用 MCP：检查项目；必要时初始化；读取
`admin_ui_get_generation_policy`；仅从其 `availableFamilies` 选择页面族；读取对应页面族契约；
写入 Page Spec 并构建。若实时策略与任何旧指引冲突，以实时策略为准。

业务人员只提供业务需求。不得要求其提供页面类型、模板、组件、Vue、HTML、CSS、路径或构建命令；
也不得手写或修改派生产物。
<!-- admin-pc-ant-policy:end -->
