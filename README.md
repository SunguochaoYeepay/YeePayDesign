# 老板管账后台原型 PoC

这个目录用于验证：能否基于 OpenDesign，把产品自然语言需求转成符合老板管账后台视觉规范的高保真 HTML 原型。

## 本轮最小验证

验证一个组合页面流程：

```text
余额分账规则设置列表页
  -> 点击新增分账规则
  -> 弹窗表单
  -> 提交成功结果页
```

## 推荐使用顺序

1. 在 OpenDesign 中创建或打开本项目目录。
2. 使用 `design-system/DESIGN.md` 作为设计系统。
3. 使用 `skills/admin-query-flow/SKILL.md` 作为生成 Skill。
4. 把 `prompts/test-prompts.md` 中的测试需求粘贴给 OpenDesign。
5. 要求 Agent 先输出 `Page Spec`，再基于模板输出单文件 HTML。
6. 用 `qa/visual-checklist.md` 做人工审核。

## 目录说明

```text
design-system/  视觉规范和 CSS tokens
shell/          固定后台外壳结构
templates/      列表、弹窗表单、结果页模板
skills/         OpenDesign Skill
specs/          Page Spec 示例和规则
prompts/        测试需求
qa/             审核清单
assets/         设计体系导出的截图、logo、插图等资产
source-design-system/ 原始 OpenDesign 设计体系压缩包解压内容
```

## 验证成功标准

- AI 能正确理解菜单、查询条件、表格列、按钮、弹窗字段。
- 页面使用固定菜单、顶部栏、Tabs、页脚，不重新设计通用区域。
- 视觉风格接近参考图：红橙主色、浅灰背景、白色卡片、紧凑表格。
- 输出为可直接预览的单文件 HTML。
- 产品、UI、前端都能基于产物提出修改意见并继续迭代。

## 第二轮验证目标

第一轮已经验证 OpenDesign 可以生成接近目标风格的后台页面。

第二轮开始收紧边界：

```text
Shell 固定
  -> 左侧菜单、顶部栏、Tabs、用户区、页脚不再由 AI 自由生成

内容区可变
  -> AI 只生成 #page-content 内的列表、表单、详情、结果页等业务内容
```

新增文件：

- `shell/menu.config.yaml`：固定菜单、Tabs、用户区、图标语义。
- `templates/page-content.template.html`：内容区输出模板。

第二轮请优先使用 `prompts/test-prompts.md` 里的“第二轮验证：只生成内容区”。

## 内容区预览方式

第二轮会生成两个页面产物：

- `page-content.html`：只包含业务内容区，用来验证 AI 是否没有改 Shell。
- `preview.html`：把 `page-content.html` 注入固定 Shell，并带上 `tokens.css` 和 `components.css`，用来视觉预览。

如果只有 `page-content.html`，可以在项目根目录运行：

```bash
node tools/build-preview.mjs page-content.html preview.html
```

然后打开 `preview.html` 查看带样式的完整页面。
