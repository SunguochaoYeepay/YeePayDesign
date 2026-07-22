# Context Packs

Context Pack 是面向原型生成 Agent 的压缩运行上下文，不替代设计系统、Shell、模板或完整规则。它的目标是减少每个业务需求重新读取工程源码的次数。

## 使用方式

1. 通过 MCP 读取当前生成策略；不要从旧对话或项目提示推断支持范围。
2. 读取 `admin-pc-ant-core.md` 与由策略生成的 `index.md`，根据业务需求选择一个当前开放的页面族包。
3. 只读取被选中的页面族包，例如 `admin-pc-ant-form.md`。
4. 使用原始业务需求和参考图生成 Page Spec、内容区和预览。

## OpenDesign 项目初始化

每个新 OpenDesign Design Files 项目只需初始化一次，使预览构建器能在**产物实际写入的当前工作目录**访问真实运行框架：

```bash
node tools/prepare-opendesign-project.mjs "<OpenDesign 项目目录>"
```

初始化会复制 `design-system/`、`shell/`、`tools/`、`context-packs/` 到目标项目，不复制业务输出。OpenDesign Agent 沙盒不稳定支持符号链接，因此“关联本地代码”只提供只读参考，不能替代初始化；构建器和静态校验器必须从当前项目读取这些文件。

## 维护规则

- 修改 Shell、token、图标机制、输出边界或质量门禁后，更新 `admin-pc-ant-core.md`。
- 修改某个页面族的能力、模板、布局或交互规则后，更新对应页面族包。
- Context Pack 不包含业务案例、示例数据或特定菜单路径。
- 生成 Agent 不能在单页面任务中回退为全量读取原始规则目录；若 Context Pack 缺少必要语义，记录为风险并交由框架维护者补充。
