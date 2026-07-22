import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  absoluteArtifactPaths,
  registerProjectPipelineTools,
  toProjectRoot
} from "./admin-prototype-core.mjs";

export function createStdioServer() {
  const server = new McpServer({
    name: "admin-pc-ant-prototype",
    version: "0.2.0"
  });

  registerProjectPipelineTools(server, {
    projectArgument: "projectRoot",
    projectSchema: z.string().min(1),
    resolveProject: (projectRoot) => ({ root: toProjectRoot(projectRoot) }),
    projectIdentity: (context) => ({ activeProjectRoot: context.root }),
    presentArtifacts: absoluteArtifactPaths
  });

  return server;
}

async function main() {
  const server = createStdioServer();
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error("admin-pc-ant MCP server failed:", error);
  process.exit(1);
});
