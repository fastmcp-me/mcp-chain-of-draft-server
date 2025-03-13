import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { chainOfDraftTool } from "./chainOfDraftTool.js";
import { apiBlueprintDesignerTool } from "./apiBluprintDesignerTool.js";
import { architectureDecisionRecorderTool } from "./architectureDecisionRecorderTool.js";
import { codeReviewLensTool } from "./codeReviewLensTool.js";
import { implementationStrategyPlannerTool } from "./implementationStrategyPlannerTool.js";

export const registerTools = (server: McpServer) => {
    chainOfDraftTool(server);
    apiBlueprintDesignerTool(server);
    architectureDecisionRecorderTool(server);
    codeReviewLensTool(server);
    implementationStrategyPlannerTool(server);
}

