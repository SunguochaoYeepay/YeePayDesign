# YeePayDesign 工程规划

这个仓库用于沉淀基于 OpenDesign 的企业级 AI Design 原型生产体系。

## 当前阶段

当前先固定老板管账后台 PC 端 PoC：

- 设计系统：`design-system/`
- 固定 Shell：`shell/`
- 页面模板：`templates/`
- 页面生成 Skill：`skills/admin-query-flow/`
- Page Spec：`specs/`
- 测试提示词：`prompts/`
- QA 清单：`qa/`
- 预览注入工具：`tools/build-preview.mjs`

当前已验证链路：

```text
自然语言需求
  -> Page Spec
  -> page-content.html
  -> 注入固定 Shell
  -> preview.html
```

## 后续多端扩展

后面可以逐步扩展成多套设计框架：

```text
platforms/
  admin-pc/        PC 后台管理框架
  mobile-h5/       移动 H5 框架
  mini-program/    小程序框架
  app-native/      原生 App 原型框架
```

第一阶段暂不搬动现有目录，避免影响 OpenDesign 当前项目读取。等 PC PoC 稳定后，再把当前根目录内容迁移到 `platforms/admin-pc/`，并在根目录保留统一入口。

## 维护原则

- Shell 由 UI/前端/Codex 维护，业务生成 Agent 不直接修改。
- 内容区由 OpenDesign + Skill 生成。
- `DESIGN.md` 控制视觉规范。
- `tokens.css` 控制机器可执行的设计变量。
- `menu.config.yaml` 控制菜单、Tabs、图标语义和路由。
- `page-content.html` 是业务内容片段。
- `preview.html` 是注入固定 Shell 后的预览产物。

## Git 策略

建议每次稳定一个能力点就提交一次：

- `poc:` 最小验证相关提交
- `shell:` 框架、菜单、顶部栏、交互相关提交
- `design:` 设计系统、tokens、组件样式相关提交
- `skill:` Skill 和提示词相关提交
- `template:` 页面模板相关提交
- `qa:` 审核规则和检查脚本相关提交

