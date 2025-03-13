import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { chainOfDraftTool } from "./chainOfDraftTool.js";


export const registerTools = (server: McpServer) => {
    chainOfDraftTool(server);
}

