import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_SCHEMA, TOOL_DESCRIPTION } from "./architectureDecisionRecorderParams.js";
import { logger } from "../utils/logging.js";
import { SessionManagerFactory } from "../utils/sessionManagerFactory.js";
import { ADRSession } from "../utils/toolSessions.js";

export interface Alternative {
    option: string;
    pros: string[];
    cons: string[];
}

export interface ADRData {
    // Required fields
    id: string;
    title: string;
    status: "proposed" | "accepted" | "rejected" | "deprecated" | "superseded";
    context: string;
    decision: string;
    consequences: string[];
    alternatives: Alternative[];
    related_decisions: string[];
    draft_number: number;
    total_drafts: number;

    // Optional fields
    is_critique?: boolean;
    critique_focus?: string;
    revision_instructions?: string;
    is_final_draft: boolean;  // This has a default of false
}

export const architectureDecisionRecorderTool = (server: McpServer): void => {
    const processADRRequest = async (input: unknown) => {
        try {
            const validatedInput = validateADRData(input);
            if (!validatedInput) {
                throw new McpError(ErrorCode.InvalidParams, "Invalid ADR data");
            }

            // Validate draft progression
            if (validatedInput.draft_number > validatedInput.total_drafts) {
                validatedInput.total_drafts = validatedInput.draft_number;
            }

            // Get session manager and retrieve/create session
            const sessionManager = SessionManagerFactory.getInstance().getADRManager();
            const session = await sessionManager.getSession(validatedInput.id);

            // Initialize session data if needed
            if (!session.data.adrHistory) {
                session.data.adrHistory = [];
            }

            // Store the ADR in history
            session.data.adrHistory.push(validatedInput);

            // Update session
            await sessionManager.updateSession(validatedInput.id, session.data);

            // Format response
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        id: validatedInput.id,
                        title: validatedInput.title,
                        status: validatedInput.status,
                        draftNumber: validatedInput.draft_number,
                        totalDrafts: validatedInput.total_drafts,
                        isCritique: validatedInput.is_critique,
                        critiqueFocus: validatedInput.critique_focus,
                        revisionInstructions: validatedInput.revision_instructions,
                        isFinalDraft: validatedInput.is_final_draft,
                        historyLength: session.data.adrHistory.length,
                        sessionMetadata: session.metadata
                    }, null, 2)
                }]
            };
        } catch (error) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(
                ErrorCode.InternalError,
                error instanceof Error ? error.message : String(error)
            );
        }
    };

    server.tool(
        TOOL_NAME,
        TOOL_DESCRIPTION,
        TOOL_SCHEMA,
        async (args, extra) => ({
            content: [{
                type: "text" as const,
                text: JSON.stringify(await processADRRequest(args))
            }]
        })
    );
}

const validateADRData = (input: unknown): ADRData | null => {
    const data = input as Record<string, unknown>;

    // Check only required fields first
    if (typeof data !== "object" || data === null ||
        !("id" in data) ||
        !("title" in data) ||
        !("status" in data) ||
        !("context" in data) ||
        !("decision" in data) ||
        !("consequences" in data) ||
        !("alternatives" in data) ||
        !("related_decisions" in data) ||
        !("draft_number" in data) ||
        !("total_drafts" in data)) {
        throw new Error("Missing required fields");
    }

    // Validate types and create return object
    const adrData: ADRData = {
        id: String(data.id),
        title: String(data.title),
        status: String(data.status) as ADRData["status"],
        context: String(data.context),
        decision: String(data.decision),
        consequences: Array.isArray(data.consequences) ? data.consequences.map(String) : [],
        alternatives: Array.isArray(data.alternatives) ? data.alternatives : [],
        related_decisions: Array.isArray(data.related_decisions) ? data.related_decisions.map(String) : [],
        draft_number: Number(data.draft_number),
        total_drafts: Number(data.total_drafts),
        is_final_draft: Boolean(data.is_final_draft ?? false)
    };

    // Optional fields
    if ("is_critique" in data) adrData.is_critique = Boolean(data.is_critique);
    if ("critique_focus" in data) adrData.critique_focus = String(data.critique_focus);
    if ("revision_instructions" in data) adrData.revision_instructions = String(data.revision_instructions);

    // Validate the data
    if (!adrData.id || adrData.id.trim() === "") {
        throw new Error("Invalid ID");
    }

    if (!adrData.title || adrData.title.trim() === "") {
        throw new Error("Invalid title");
    }

    const validStatuses = ["proposed", "accepted", "rejected", "deprecated", "superseded"];
    if (!validStatuses.includes(adrData.status)) {
        throw new Error("Invalid status");
    }

    if (!adrData.context || adrData.context.trim() === "") {
        throw new Error("Invalid context");
    }

    if (!adrData.decision || adrData.decision.trim() === "") {
        throw new Error("Invalid decision");
    }

    if (!Array.isArray(adrData.consequences)) {
        throw new Error("Invalid consequences");
    }

    if (!Array.isArray(adrData.alternatives)) {
        throw new Error("Invalid alternatives");
    }

    if (!Array.isArray(adrData.related_decisions)) {
        throw new Error("Invalid related decisions");
    }

    if (adrData.draft_number <= 0) {
        throw new Error("Draft number must be positive");
    }

    if (adrData.total_drafts <= 0) {
        throw new Error("Total drafts must be positive");
    }

    if (adrData.draft_number > adrData.total_drafts) {
        throw new Error("Draft number cannot exceed total drafts");
    }

    // Validate critique-specific fields
    if (adrData.is_critique && !adrData.critique_focus) {
        throw new Error("Critique focus required when is_critique is true");
    }

    // Validate revision-specific fields
    if (adrData.is_critique === false && !adrData.revision_instructions) {
        throw new Error("Revision instructions required when is_critique is false");
    }

    return adrData;
}

const formatADR = (adr: ADRData): string => {
    return JSON.stringify({
        id: adr.id,
        title: adr.title,
        status: adr.status,
        context: adr.context,
        decision: adr.decision,
        consequences: adr.consequences,
        alternatives: adr.alternatives,
        related_decisions: adr.related_decisions,
        draft_number: adr.draft_number,
        total_drafts: adr.total_drafts,
        is_critique: adr.is_critique,
        critique_focus: adr.critique_focus,
        revision_instructions: adr.revision_instructions,
        is_final_draft: adr.is_final_draft
    });
}