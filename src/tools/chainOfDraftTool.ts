import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_SCHEMA, TOOL_DESCRIPTION } from "./chainOfDraftParams.js";
import { logger } from "../utils/logging.js";

interface ThoughtData {
    // Required fields
    reasoning_chain: string[];
    next_step_needed: boolean;
    draft_number: number;
    total_drafts: number;

    // Optional fields
    is_critique?: boolean;
    critique_focus?: string;
    revision_instructions?: string;
    step_to_review?: number;
    is_final_draft: boolean;  // This has a default of false
}

const thoughtHistory: ThoughtData[] = [];
const branches: Record<string, ThoughtData[]> = {};

export const chainOfDraftTool = (server: McpServer): void => {
    const processThoughtRequest = async (input: unknown) => {
        try {
            const validatedInput = validateThoughtData(input);
            if (!validatedInput) {
                throw new McpError(ErrorCode.InvalidParams, "Invalid thought data");
            }

            // Validate draft progression
            if (validatedInput.draft_number > validatedInput.total_drafts) {
                validatedInput.total_drafts = validatedInput.draft_number;
            }

            // Store the thought in history
            thoughtHistory.push(validatedInput);

            // Handle branching if specified
            if (validatedInput.step_to_review !== undefined) {
                const branchId = `branch_${validatedInput.draft_number}_${validatedInput.step_to_review}`;
                if (!branches[branchId]) {
                    branches[branchId] = [];
                }
                branches[branchId].push(validatedInput);
            }

            // Format response
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        draftNumber: validatedInput.draft_number,
                        totalDrafts: validatedInput.total_drafts,
                        nextStepNeeded: validatedInput.next_step_needed,
                        isCritique: validatedInput.is_critique,
                        critiqueFocus: validatedInput.critique_focus,
                        revisionInstructions: validatedInput.revision_instructions,
                        stepToReview: validatedInput.step_to_review,
                        isFinalDraft: validatedInput.is_final_draft,
                        branches: Object.keys(branches),
                        thoughtHistoryLength: thoughtHistory.length
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
                text: JSON.stringify(await processThoughtRequest(args))
            }]
        })
    );
}

// const TOOL_DESCRIPTION = `
//     A tool for generating and refining reasoning chains using Chain of Draft (CoD).

// This tool enhances Chain of Thought (CoT) prompting by incorporating iterative critique and revision of the generated reasoning steps, leading to more accurate and robust conclusions.

// When to use this tool:
// -   Complex reasoning tasks where accuracy and logical flow are critical.
// -   Problems that require breaking down into multiple steps, and where each step needs careful scrutiny.
// -   Situations where the initial reasoning chain might contain errors, inconsistencies, or gaps.
// -   For tasks like solving math problems, logical puzzles, and detailed analysis of complex information.

// Key features:
// -   Generates an initial chain of thought.
// -   Allows for iterative critique and revision of individual steps or the entire chain.
// -   Enables focusing on specific aspects of the reasoning (e.g., logical validity, completeness, relevance).
// -   Provides parameters to control the CoT process, such as draft number, total drafts, and revision focus.
// -   Maintains context across iterations of the reasoning chain.

// Parameters explained:
// -   reasoning_chain: The current chain of thought, consisting of one or more reasoning steps.
// -   next_step_needed: True if another critique/revision cycle is needed.
// -   draft_number: The current draft number (starting from 1).
// -   total_drafts: The total number of draft/revision cycles planned.
// -   is_critique: Boolean indicating if the current step is a critique (true) or revision (false).
// -   critique_focus: Specifies the focus of the current critique (e.g., "logical validity", "completeness", "relevance", "clarity").
// -   revision_instructions: Specific instructions for the revision, based on the critique.
// -   step_to_revise: (Optional) If revising a specific step, the index or identifier of that step.

// You should:
// 1.  Start with an initial reasoning_chain and set total_drafts.
// 2.  Use is_critique to alternate between critique and revision steps.
// 3.  Specify critique_focus to guide the critique process.
// 4.  Provide detailed revision_instructions based on the critique.
// 5.  Use step_to_revise to target specific parts of the reasoning chain.
// 6.  Adjust total_drafts as needed based on the progress.
// 7.  Set next_step_needed to false only when the final reasoning_chain is complete and satisfactory.

// `;

const validateThoughtData = (input: unknown): ThoughtData | null => {
    const data = input as Record<string, unknown>;

    // Check only required fields first
    if (typeof data !== "object" || data === null ||
        !("reasoning_chain" in data) ||
        !("next_step_needed" in data) ||
        !("draft_number" in data) ||
        !("total_drafts" in data)) {
        throw new Error("Missing required fields");
    }

    // Validate types and create return object
    const thoughtData: ThoughtData = {
        reasoning_chain: Array.isArray(data.reasoning_chain) ? data.reasoning_chain : [],
        next_step_needed: Boolean(data.next_step_needed),
        draft_number: Number(data.draft_number),
        total_drafts: Number(data.total_drafts),
        is_final_draft: Boolean(data.is_final_draft ?? false)
    };

    // Optional fields
    if ("is_critique" in data) thoughtData.is_critique = Boolean(data.is_critique);
    if ("critique_focus" in data) thoughtData.critique_focus = String(data.critique_focus);
    if ("revision_instructions" in data) thoughtData.revision_instructions = String(data.revision_instructions);
    if ("step_to_review" in data) thoughtData.step_to_review = Number(data.step_to_review);

    // Validate the data
    if (!Array.isArray(thoughtData.reasoning_chain) || thoughtData.reasoning_chain.length === 0) {
        throw new Error("Invalid reasoning chain");
    }

    if (thoughtData.draft_number <= 0) {
        throw new Error("Draft number must be positive");
    }

    if (thoughtData.total_drafts <= 0) {
        throw new Error("Total drafts must be positive");
    }

    if (thoughtData.draft_number > thoughtData.total_drafts) {
        throw new Error("Draft number cannot exceed total drafts");
    }

    // Validate critique-specific fields
    if (thoughtData.is_critique && !thoughtData.critique_focus) {
        throw new Error("Critique focus required when is_critique is true");
    }

    return thoughtData;
}
const formatThought = (thought: ThoughtData): string => {
    return JSON.stringify({
        thoughtNumber: thought.draft_number,
        thought: thought.reasoning_chain
    });
}

const processThought = (input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } => {
    try {
        const validatedInput = validateThoughtData(input);
        if (!validatedInput) {
            throw new Error("Invalid thought data");
        }

        // make sure we have a valid thought number
        if (validatedInput.draft_number <= 0) {
            throw new Error("Invalid draft number");
        }

        // make sure we have a valid total drafts
        if (validatedInput.total_drafts <= 0) {
            throw new Error("Invalid total drafts");
        }

        // make sure we have a valid reasoning chain
        if (!Array.isArray(validatedInput.reasoning_chain) || validatedInput.reasoning_chain.length === 0) {
            throw new Error("Invalid reasoning chain");
        }

        // make sure we have a valid next step needed
        if (typeof validatedInput.next_step_needed !== "boolean") {
            throw new Error("Invalid next step needed");
        }

        // make sure we have a valid critique focus
        if (validatedInput.is_critique && !validatedInput.critique_focus) {
            throw new Error("Invalid critique focus");
        }

        // make sure we have a valid revision instructions
        if (validatedInput.is_critique && !validatedInput.revision_instructions) {
            throw new Error("Invalid revision instructions");
        }

        // make sure we have a valid step to review
        if (validatedInput.step_to_review && (typeof validatedInput.step_to_review !== "number" || validatedInput.step_to_review < 0)) {
            throw new Error("Invalid step to review");
        }

        // make sure we have a valid is final draft
        if (typeof validatedInput.is_final_draft !== "boolean") {
            throw new Error("Invalid is final draft");
        }

        // make sure the current ask is not greater than the total drafts
        if (validatedInput.draft_number > validatedInput.total_drafts) {
            throw new Error("Current draft number is greater than the total drafts");
        }

        const formattedThought = formatThought(validatedInput);
        logger.error(formattedThought);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    thoughtNumber: validatedInput.draft_number,
                    thought: formattedThought
                })
            }]
        }


    } catch (error) {
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    error: error instanceof Error ? error.message : String(error),
                    status: 'failed'
                }, null, 2)
            }],
            isError: true
        };
    }
}