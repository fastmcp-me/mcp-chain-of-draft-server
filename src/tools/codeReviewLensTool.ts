import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_SCHEMA, TOOL_DESCRIPTION } from "./codeReviewLensParams.js";
import { logger } from "../utils/logging.js";

type ReviewDimension = "performance" | "security" | "maintainability" | "readability" | "testability" | "correctness" | "documentation";
type FindingSeverity = "info" | "suggestion" | "warning" | "critical";

interface CodeFile {
    path: string;
    content: string;
    language: string;
    line_count: number;
}

interface ReviewFinding {
    file: string;
    line_range: [number, number];
    dimension: ReviewDimension;
    severity: FindingSeverity;
    description: string;
    suggested_fix?: string;
    justification?: string;
}

interface CodeReviewData {
    // Required fields
    review_id: string;
    pull_request_id: string;
    repository: string;
    review_dimensions: ReviewDimension[];
    files: CodeFile[];
    findings: ReviewFinding[];
    draft_number: number;
    total_drafts: number;
    next_step_needed: boolean;

    // Optional fields
    is_critique?: boolean;
    critique_focus?: string;
    revision_instructions?: string;
    is_final_draft?: boolean;
}

const reviewHistory: Record<string, CodeReviewData[]> = {};
const activeCritiques: Record<string, string[]> = {};

export const codeReviewLensTool = (server: McpServer): void => {
    const processReviewRequest = async (input: unknown) => {
        try {
            const validatedInput = validateCodeReviewData(input);
            if (!validatedInput) {
                throw new McpError(ErrorCode.InvalidParams, "Invalid code review data");
            }

            // Validate draft progression
            if (validatedInput.draft_number > validatedInput.total_drafts) {
                validatedInput.total_drafts = validatedInput.draft_number;
            }

            // Initialize history for this review if needed
            const reviewId = validatedInput.review_id;
            if (!reviewHistory[reviewId]) {
                reviewHistory[reviewId] = [];
            }

            // Store the code review in history
            reviewHistory[reviewId].push(validatedInput);

            // Handle critique tracking
            if (validatedInput.is_critique && validatedInput.critique_focus) {
                if (!activeCritiques[reviewId]) {
                    activeCritiques[reviewId] = [];
                }
                activeCritiques[reviewId].push(validatedInput.critique_focus);
            }

            // Format response
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        reviewId: validatedInput.review_id,
                        pullRequestId: validatedInput.pull_request_id,
                        repository: validatedInput.repository,
                        draftNumber: validatedInput.draft_number,
                        totalDrafts: validatedInput.total_drafts,
                        dimensions: validatedInput.review_dimensions,
                        fileCount: validatedInput.files.length,
                        findingCount: validatedInput.findings.length,
                        nextStepNeeded: validatedInput.next_step_needed,
                        isCritique: validatedInput.is_critique,
                        critiqueFocus: validatedInput.critique_focus,
                        revisionInstructions: validatedInput.revision_instructions,
                        activeCritiques: activeCritiques[reviewId] || [],
                        reviewHistoryLength: reviewHistory[reviewId].length,
                        isFinalDraft: validatedInput.is_final_draft
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
                text: JSON.stringify(await processReviewRequest(args))
            }]
        })
    );
}

const validateCodeReviewData = (input: unknown): CodeReviewData | null => {
    const data = input as Record<string, unknown>;

    // Check required fields first
    if (typeof data !== "object" || data === null ||
        !("review_id" in data) ||
        !("pull_request_id" in data) ||
        !("repository" in data) ||
        !("review_dimensions" in data) ||
        !("files" in data) ||
        !("findings" in data) ||
        !("draft_number" in data) ||
        !("total_drafts" in data) ||
        !("next_step_needed" in data)) {
        throw new Error("Missing required fields");
    }

    // Validate dimensions
    if (!Array.isArray(data.review_dimensions)) {
        throw new Error("Review dimensions must be an array");
    }

    const validDimensions = ["performance", "security", "maintainability", "readability", "testability", "correctness", "documentation"];
    const validSeverities = ["info", "suggestion", "warning", "critical"];

    const dimensions: ReviewDimension[] = [];
    for (const dim of data.review_dimensions) {
        const dimStr = String(dim);
        if (!validDimensions.includes(dimStr)) {
            throw new Error(`Invalid review dimension: ${dimStr}. Must be one of: ${validDimensions.join(", ")}`);
        }
        dimensions.push(dimStr as ReviewDimension);
    }

    // Validate files
    if (!Array.isArray(data.files)) {
        throw new Error("Files must be an array");
    }

    const files: CodeFile[] = [];
    for (const file of data.files) {
        if (typeof file !== "object" || file === null ||
            !("path" in file) ||
            !("content" in file) ||
            !("language" in file) ||
            !("line_count" in file)) {
            throw new Error("Each file must have path, content, language, and line_count");
        }

        const lineCount = Number(file.line_count);
        if (isNaN(lineCount) || lineCount < 0) {
            throw new Error("Line count must be a non-negative number");
        }

        files.push({
            path: String(file.path),
            content: String(file.content),
            language: String(file.language),
            line_count: lineCount
        });
    }

    // Validate findings
    if (!Array.isArray(data.findings)) {
        throw new Error("Findings must be an array");
    }

    const findings: ReviewFinding[] = [];
    for (const finding of data.findings) {
        if (typeof finding !== "object" || finding === null ||
            !("file" in finding) ||
            !("line_range" in finding) ||
            !("dimension" in finding) ||
            !("severity" in finding) ||
            !("description" in finding)) {
            throw new Error("Each finding must have file, line_range, dimension, severity, and description");
        }

        // Validate line range
        if (!Array.isArray(finding.line_range) || finding.line_range.length !== 2) {
            throw new Error("Line range must be an array of two numbers [start, end]");
        }

        const startLine = Number(finding.line_range[0]);
        const endLine = Number(finding.line_range[1]);
        if (isNaN(startLine) || isNaN(endLine) || startLine < 1 || endLine < startLine) {
            throw new Error("Invalid line range: start line must be >= 1 and end line must be >= start line");
        }

        // Validate dimension
        const dimStr = String(finding.dimension);
        if (!validDimensions.includes(dimStr)) {
            throw new Error(`Invalid finding dimension: ${dimStr}. Must be one of: ${validDimensions.join(", ")}`);
        }

        // Validate severity
        const sevStr = String(finding.severity);
        if (!validSeverities.includes(sevStr)) {
            throw new Error(`Invalid finding severity: ${sevStr}. Must be one of: ${validSeverities.join(", ")}`);
        }

        const reviewFinding: ReviewFinding = {
            file: String(finding.file),
            line_range: [startLine, endLine],
            dimension: dimStr as ReviewDimension,
            severity: sevStr as FindingSeverity,
            description: String(finding.description)
        };

        // Optional fields
        if ("suggested_fix" in finding) reviewFinding.suggested_fix = String(finding.suggested_fix);
        if ("justification" in finding) reviewFinding.justification = String(finding.justification);

        findings.push(reviewFinding);
    }

    // Create and validate code review data object
    const reviewData: CodeReviewData = {
        review_id: String(data.review_id),
        pull_request_id: String(data.pull_request_id),
        repository: String(data.repository),
        review_dimensions: dimensions,
        files: files,
        findings: findings,
        draft_number: Number(data.draft_number),
        total_drafts: Number(data.total_drafts),
        next_step_needed: Boolean(data.next_step_needed)
    };

    // Optional fields
    if ("is_critique" in data) reviewData.is_critique = Boolean(data.is_critique);
    if ("critique_focus" in data) reviewData.critique_focus = String(data.critique_focus);
    if ("revision_instructions" in data) reviewData.revision_instructions = String(data.revision_instructions);
    if ("is_final_draft" in data) reviewData.is_final_draft = Boolean(data.is_final_draft);

    // Additional validations
    if (reviewData.draft_number <= 0) {
        throw new Error("Draft number must be positive");
    }

    if (reviewData.total_drafts <= 0) {
        throw new Error("Total drafts must be positive");
    }

    if (reviewData.draft_number > reviewData.total_drafts) {
        throw new Error("Draft number cannot exceed total drafts");
    }

    // Validate critique-specific fields
    if (reviewData.is_critique && !reviewData.critique_focus) {
        throw new Error("Critique focus required when is_critique is true");
    }

    // Validate revision-specific fields
    if (reviewData.is_critique === false && !reviewData.revision_instructions) {
        throw new Error("Revision instructions required when is_critique is false");
    }

    // Validate file and finding relationships
    const filePaths = files.map(f => f.path);
    for (const finding of findings) {
        if (!filePaths.includes(finding.file)) {
            throw new Error(`Finding references file '${finding.file}' which is not in the files array`);
        }
    }

    return reviewData;
}

const formatCodeReview = (review: CodeReviewData): string => {
    return JSON.stringify({
        reviewId: review.review_id,
        pullRequestId: review.pull_request_id,
        repository: review.repository,
        dimensions: review.review_dimensions,
        fileCount: review.files.length,
        findingCount: review.findings.length,
        findingsBySeverity: {
            info: review.findings.filter(f => f.severity === "info").length,
            suggestion: review.findings.filter(f => f.severity === "suggestion").length,
            warning: review.findings.filter(f => f.severity === "warning").length,
            critical: review.findings.filter(f => f.severity === "critical").length
        },
        draftNumber: review.draft_number
    }, null, 2);
}
