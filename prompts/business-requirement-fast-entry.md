# 快速业务需求入口

以下内容是业务需求，不是开发任务清单。业务人员无需指定页面类型、模板、平台、
图标、Vue、HTML 或输出路径。

## 固定执行步骤

1. 首先在**当前工作目录**执行以下前置检查。不得凭对话上下文、项目名称、截图、
   关联的只读参考代码或附件推断项目已初始化：

   ```bash
   project_root="$(pwd -P)"
   printf 'ACTIVE_PROJECT_ROOT:%s\n' "$project_root"

   for path in \
     context-packs/admin-pc-ant-core.md \
     context-packs/index.md \
     design-system/tokens.css \
     design-system/components.css \
     design-system/icon-runtime.js \
     design-system/icons/ant/sprite.svg \
     design-system/vue-ant/dist/runtime.js \
     design-system/vue-ant/dist/runtime.css \
     design-system/vue-ant/dist/runtime-manifest.json \
     shell/app-shell.html \
     shell/shell-interactions.js \
     shell/assets/logo-vertical.png \
     tools/build-vue-ant-page.mjs \
     tools/check-admin-pc-content.mjs \
     tools/build-preview.mjs \
     tools/lib/vue-ant-page-contract.bundle.cjs; do
     test -r "$project_root/$path" || { echo "MISSING:$path"; exit 42; }
   done

   test -w "$project_root" || { echo 'MISSING:write-access-to-current-project'; exit 42; }
   ```

2. 若前置检查失败，立即停止。本轮只允许汇报“项目未初始化”、
   `ACTIVE_PROJECT_ROOT` 和缺失路径；禁止读取关联参考项目来补足文件，禁止生成
   Page Spec、HTML、iframe、临时壳、检查清单或预览，也禁止声称任何规则通过。
3. 仅当前置检查通过后，读取 `context-packs/admin-pc-ant-core.md` 和
   `context-packs/index.md`。
4. 依据完整业务意图选择一个主页面族，只读取对应 Context Pack。选择后先确认
   对应包存在且当前状态为“可用”：`form` 读取
   `context-packs/admin-pc-ant-form.md`，`list` 读取
   `context-packs/admin-pc-ant-list.md`，`detail` 读取
   `context-packs/admin-pc-ant-detail.md`。其他页面族报告当前不支持，不得回退为
   手写 HTML。
5. 确认本次能力组合已被当前 Vue/Ant 渲染器支持。未支持时只报告“当前 Vue/Ant
   渲染器尚未支持该能力”及能力名称，立即停止；不得生成旧 HTML、iframe 或临时
   兼容页面。
6. 在内部完成“需求理解 -> Page Spec v2”，不反复叙述中间推理。Page Spec 必须
   固定声明：

   ```yaml
   ui:
     platform: admin-pc-ant
     runtime: vue-ant
     rendererVersion: 2
   ```

   表单还必须先按以下顺序选择并声明 `template.id`：上传-校验-复核-确认-结果闭环使用
   `form.import-review-flow`；明确阶段依赖使用 `form.staged-configuration`；无阶段依赖但需要
   多信息组使用 `form.grouped-configuration`；其余少量独立字段使用 `form.single-stage`。
   `form.steps`、`form.groups`、`form.modeTabs` 是能力，不是模板名。

   列表必须提供结构化 `table.rows`；表单副作用必须使用 `form.interactions` 和
   `form.submit` 的结构化声明。不得生成页面级 Vue、JavaScript、CSS 或 HTML 控件。
7. 为本次业务选择新的、语义明确的输出目录，不得覆盖其他业务页面。只写入
   `page-spec.yaml`，然后从 `ACTIVE_PROJECT_ROOT` 运行唯一构建命令：

   ```bash
   node tools/build-vue-ant-page.mjs \
     outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/page-spec.yaml \
     outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/page-content.html \
     outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/checklist.md \
     outputs/features/{{FEATURE_SLUG}}/{{PAGE_SLUG}}/preview.html
   ```

   该命令会生成内容区、检查清单和完整预览。禁止手写或修改后三个派生产物。
8. 构建失败时，本轮为“构建阻断”：不得伪造、占位或报告 `preview.html` 已完成，
   不得输出通过的评分卡。只汇报失败阶段、`ACTIVE_PROJECT_ROOT` 与失败原因；
   对 Page Spec 最多做一次针对性修正后重跑。
9. 只有构建命令成功后，最终才汇报 `page-spec.yaml`、`page-content.html`、
   `checklist.md`、`preview.html` 四个路径和不超过三行的风险/假设摘要。

用户截图仅为视觉参考，禁止将截图文件直接嵌入页面。真实业务配图只能使用已登记
资产；没有资产时使用渲染器规定的图片形态占位。

当前快速入口支持 `form`、`list` 和 `detail` 页面族；若识别为其他页面族，说明当前不支持。

## 业务需求

{{在这里粘贴业务人员的原始需求，可附截图}}
