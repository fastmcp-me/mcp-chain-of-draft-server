import { APIBlueprintData } from "../tools/apiBluprintDesignerTool.js";
import { ADRData } from "../tools/architectureDecisionRecorderTool.js";
import { CodeReviewData } from "../tools/codeReviewLensTool.js";
import { ImplementationStrategyData } from "../tools/implementationStrategyPlannerTool.js";

export interface APIBlueprintSession {
    apiHistory: APIBlueprintData[];
    activeCritiques: string[];
}

export interface ADRSession {
    adrHistory: ADRData[];
}

export interface CodeReviewSession {
    reviewHistory: CodeReviewData[];
    activeCritiques: string[];
}

export interface ImplementationStrategySession {
    strategyHistory: ImplementationStrategyData[];
    activeCritiques: string[];
}

// Create session managers for each tool
export const createToolSessions = () => {
    const sessions = {
        apiBlueprint: new Map<string, APIBlueprintSession>(),
        adr: new Map<string, ADRSession>(),
        codeReview: new Map<string, CodeReviewSession>(),
        implementationStrategy: new Map<string, ImplementationStrategySession>()
    };

    return sessions;
}; 