# OpenDesign 项目初始化

仅在创建**新的 Design Files 项目**，且已关联本地框架代码后执行一次。本提示词不是业务需求，不生成 Page Spec、HTML、预览或业务产物。

```text
请初始化当前 OpenDesign Design Files 项目的运行目录，不生成任何业务页面或产物。

当前工作目录必须是本次 Design Files 项目的可写根目录。先输出 ACTIVE_PROJECT_ROOT，然后执行：

node "/Users/sunguochao/Documents/老板管账后台原型 PoC/tools/prepare-opendesign-project.mjs" "$(pwd -P)"

完成后只验证以下文件均存在且可读：
- context-packs/admin-pc-ant-core.md
- context-packs/index.md
- context-packs/admin-pc-ant-form.md
- design-system/tokens.css
- design-system/components.css
- design-system/icon-runtime.js
- design-system/icons/ant/sprite.svg
- design-system/vue-ant/dist/runtime.js
- design-system/vue-ant/dist/runtime.css
- design-system/vue-ant/dist/runtime-manifest.json
- shell/app-shell.html
- shell/shell-interactions.js
- tools/build-vue-ant-page.mjs
- tools/check-admin-pc-content.mjs
- tools/build-preview.mjs
- tools/lib/vue-ant-page-contract.bundle.cjs

成功时只汇报“项目初始化完成”和 ACTIVE_PROJECT_ROOT；失败时只汇报失败原因与缺失路径。不得生成或修改 outputs/ 下的任何业务产物。
```

## 使用边界

- 同一产品、同一平台、同一套设计系统：复用一个已初始化项目，不重复初始化；每个业务需求使用不同的 `outputs/features/<feature>/<page>/` 目录。
- 新产品、不同设计系统或独立平台（例如移动 H5）：创建新的 Design Files 项目后执行一次本提示词。
- “关联本地代码”只提供框架参考；初始化会把预览运行所需文件复制到当前可写项目。
