# Admin PC Ant MCP

本框架提供两种本地 MCP 接入方式。两者都调用同一套确定性 Vue / Ant 页面管线，不负责理解业务需求或生成任意 HTML。

调用 AI 负责读取页面契约、选择模板并生成 Page Spec；MCP 负责项目检查、初始化、契约读取、Page Spec 校验写入和页面构建。

## 方式一：本地命令型 MCP

适用于支持以本机命令启动 MCP 的 Codex、Claude Desktop、Cursor 等客户端。

```bash
npm run mcp:serve
```

客户端配置示例：

```json
{
  "mcpServers": {
    "admin-pc-ant-prototype": {
      "command": "node",
      "args": [
        "/absolute/path/to/老板管账后台原型 PoC/mcp/admin-prototype-server.mjs"
      ]
    }
  }
}
```

此方式的工具参数使用 `projectRoot`。客户端可传入一个已有的本地项目目录。

## 方式二：本地 HTTP MCP 网关

适用于支持 Streamable HTTP MCP URL、但不能启动本地命令的客户端。网关仅监听当前电脑的回环地址，不会暴露到局域网或公网。

```bash
npm run mcp:gateway
```

启动后，MCP 地址为：

```text
http://127.0.0.1:4318/mcp
```

客户端配置示例：

```json
{
  "mcpServers": {
    "admin-pc-ant-local": {
      "url": "http://127.0.0.1:4318/mcp"
    }
  }
}
```

不同客户端的配置字段可能略有不同；关键是使用上面的 MCP URL。

### 登记项目

HTTP 网关不会接受任意 `projectRoot`，以避免 AI 意外读写其他本地目录。它只接受预先登记的 `projectId`。

首次登记项目时：

```bash
cp mcp/local-projects.example.json mcp/local-projects.json
```

然后编辑 `mcp/local-projects.json`，将 `root` 改成要生成页面的真实目录：

```json
{
  "schemaVersion": 1,
  "projects": [
    {
      "id": "merchant-admin",
      "label": "商户后台原型",
      "root": "/Users/your-name/Documents/merchant-admin"
    }
  ]
}
```

该本地文件已被 Git 忽略，不会提交机器上的目录信息。未创建登记文件时，网关会只提供默认的 `prototype-poc` 项目，用于验证框架自身。

网关工具使用 `projectId`。先调用 `admin_ui_list_projects` 选择项目，再按下面顺序执行：

1. `admin_ui_inspect_project`
2. 仅在未初始化时调用 `admin_ui_initialize_project`
3. `admin_ui_get_generation_policy`，读取 MCP 当前开放的页面族与策略版本
4. `admin_ui_get_page_contract`，参数只能从当前策略的 `availableFamilies` 中选择
5. AI 完成 Page Spec v2 后调用 `admin_ui_write_page_spec`
6. `admin_ui_build_page`

构建成功后会返回相对产物路径和本机 `previewUrl`。预览 URL 仅服务于已登记项目下构建出的 `preview.html`，不会提供任意文件读取。

业务人员输入可参考 [后台原型业务需求](../prompts/mcp-business-requirement-entry.md)。MCP 调用顺序、页面族选择、数据完整性和最终交付格式由 Codex 的 `admin-pc-ant-mcp-generator` Skill 在内部执行，不应要求业务人员填写。

## 工具边界

- `admin_ui_write_page_spec` 只允许写入 `outputs/features/<feature-slug>/<page-slug>/page-spec.yaml`。
- 生成的 HTML、检查清单和预览只能由固定构建工具产生。
- HTTP 网关不返回项目根目录或服务器绝对路径。
- HTTP 网关固定绑定 `127.0.0.1`；若未来需要局域网或公网访问，应另行加入认证、权限、审计和隔离工作区，不能直接改为对外监听。
