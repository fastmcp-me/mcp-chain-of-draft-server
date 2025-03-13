import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_SCHEMA, TOOL_DESCRIPTION } from "./apiBluprintDesignerParams.js";
import { logger } from "../utils/logging.js";
import { SessionManagerFactory } from "../utils/sessionManagerFactory.js";
import { APIBlueprintSession } from "../utils/toolSessions.js";

export interface Parameter {
    name: string;
    location: "path" | "query" | "header" | "cookie";
    required: boolean;
    type: string;
    description: string;
}

export interface RequestBody {
    content_type: string;
    schema: Record<string, any>;
    example: string;
}

export interface Response {
    status_code: number;
    description: string;
    content_type: string;
    schema: Record<string, any>;
    example: string;
}

export interface Endpoint {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
    description: string;
    parameters: Parameter[];
    request_body?: RequestBody;
    responses: Response[];
}

export interface AuthRequirement {
    type: "none" | "basic" | "bearer" | "api_key" | "oauth2" | "custom";
    description: string;
}

export interface APIBlueprintData {
    // Required fields
    api_id: string;
    api_name: string;
    api_version: string;
    description: string;
    endpoints: Endpoint[];
    auth_requirements: AuthRequirement;
    draft_number: number;
    total_drafts: number;
    next_step_needed: boolean;

    // Optional fields
    is_critique?: boolean;
    critique_focus?: string;
    revision_instructions?: string;
    is_final_draft?: boolean;
}

const apiHistory: Record<string, APIBlueprintData[]> = {};
const activeCritiques: Record<string, string[]> = {};

export const apiBlueprintDesignerTool = (server: McpServer): void => {
    const processAPIRequest = async (input: unknown) => {
        try {
            const validatedInput = validateAPIBlueprintData(input);
            if (!validatedInput) {
                throw new McpError(ErrorCode.InvalidParams, "Invalid API blueprint data");
            }

            // Validate draft progression
            if (validatedInput.draft_number > validatedInput.total_drafts) {
                validatedInput.total_drafts = validatedInput.draft_number;
            }

            // Get session manager and retrieve/create session
            const sessionManager = SessionManagerFactory.getInstance().getAPIBlueprintManager();
            const session = await sessionManager.getSession(validatedInput.api_id);

            // Initialize session data if needed
            if (!session.data.apiHistory) {
                session.data.apiHistory = [];
            }
            if (!session.data.activeCritiques) {
                session.data.activeCritiques = [];
            }

            // Store the API blueprint in history
            session.data.apiHistory.push(validatedInput);

            // Handle critique tracking
            if (validatedInput.is_critique && validatedInput.critique_focus) {
                session.data.activeCritiques.push(validatedInput.critique_focus);
            }

            // Update session
            await sessionManager.updateSession(validatedInput.api_id, session.data);

            // Format response
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        apiId: validatedInput.api_id,
                        apiName: validatedInput.api_name,
                        apiVersion: validatedInput.api_version,
                        draftNumber: validatedInput.draft_number,
                        totalDrafts: validatedInput.total_drafts,
                        nextStepNeeded: validatedInput.next_step_needed,
                        isCritique: validatedInput.is_critique,
                        critiqueFocus: validatedInput.critique_focus,
                        revisionInstructions: validatedInput.revision_instructions,
                        endpointCount: validatedInput.endpoints.length,
                        activeCritiques: session.data.activeCritiques,
                        apiHistoryLength: session.data.apiHistory.length,
                        isFinalDraft: validatedInput.is_final_draft,
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
                text: JSON.stringify(await processAPIRequest(args))
            }]
        })
    );
}

const validateAPIBlueprintData = (input: unknown): APIBlueprintData | null => {
    const data = input as Record<string, unknown>;

    // Check required fields first
    if (typeof data !== "object" || data === null ||
        !("api_id" in data) ||
        !("api_name" in data) ||
        !("api_version" in data) ||
        !("description" in data) ||
        !("endpoints" in data) ||
        !("auth_requirements" in data) ||
        !("draft_number" in data) ||
        !("total_drafts" in data) ||
        !("next_step_needed" in data)) {
        throw new Error("Missing required fields");
    }

    // Validate endpoints
    if (!Array.isArray(data.endpoints)) {
        throw new Error("Endpoints must be an array");
    }

    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];
    const validParamLocations = ["path", "query", "header", "cookie"];
    const validAuthTypes = ["none", "basic", "bearer", "api_key", "oauth2", "custom"];

    const endpoints: Endpoint[] = [];
    for (const ep of data.endpoints) {
        if (typeof ep !== "object" || ep === null ||
            !("path" in ep) ||
            !("method" in ep) ||
            !("description" in ep) ||
            !("parameters" in ep) ||
            !("responses" in ep)) {
            throw new Error("Each endpoint must have path, method, description, parameters, and responses");
        }

        // Validate method
        if (!validMethods.includes(String(ep.method))) {
            throw new Error(`Invalid method. Must be one of: ${validMethods.join(", ")}`);
        }

        // Validate parameters
        if (!Array.isArray(ep.parameters)) {
            throw new Error("Parameters must be an array");
        }

        const parameters: Parameter[] = [];
        for (const param of ep.parameters) {
            if (typeof param !== "object" || param === null ||
                !("name" in param) ||
                !("location" in param) ||
                !("required" in param) ||
                !("type" in param) ||
                !("description" in param)) {
                throw new Error("Each parameter must have name, location, required, type, and description");
            }

            // Validate location
            if (!validParamLocations.includes(String(param.location))) {
                throw new Error(`Invalid parameter location. Must be one of: ${validParamLocations.join(", ")}`);
            }

            parameters.push({
                name: String(param.name),
                location: String(param.location) as Parameter["location"],
                required: Boolean(param.required),
                type: String(param.type),
                description: String(param.description)
            });
        }

        // Validate request body (if present)
        let requestBody: RequestBody | undefined = undefined;
        if ("request_body" in ep && ep.request_body) {
            const rb = ep.request_body as any;
            if (typeof rb !== "object" || rb === null ||
                !("content_type" in rb) ||
                !("schema" in rb) ||
                !("example" in rb)) {
                throw new Error("Request body must have content_type, schema, and example");
            }

            requestBody = {
                content_type: String(rb.content_type),
                schema: rb.schema as Record<string, any>,
                example: String(rb.example)
            };
        }

        // Validate responses
        if (!Array.isArray(ep.responses) || ep.responses.length === 0) {
            throw new Error("Responses must be a non-empty array");
        }

        const responses: Response[] = [];
        for (const resp of ep.responses) {
            if (typeof resp !== "object" || resp === null ||
                !("status_code" in resp) ||
                !("description" in resp) ||
                !("content_type" in resp) ||
                !("schema" in resp) ||
                !("example" in resp)) {
                throw new Error("Each response must have status_code, description, content_type, schema, and example");
            }

            // Validate status code
            const statusCode = Number(resp.status_code);
            if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
                throw new Error("Status code must be between 100 and 599");
            }

            responses.push({
                status_code: statusCode,
                description: String(resp.description),
                content_type: String(resp.content_type),
                schema: resp.schema as Record<string, any>,
                example: String(resp.example)
            });
        }

        endpoints.push({
            path: String(ep.path),
            method: String(ep.method) as Endpoint["method"],
            description: String(ep.description),
            parameters: parameters,
            request_body: requestBody,
            responses: responses
        });
    }

    // Validate auth requirements
    if (typeof data.auth_requirements !== "object" || data.auth_requirements === null ||
        !("type" in data.auth_requirements) ||
        !("description" in data.auth_requirements)) {
        throw new Error("Auth requirements must have type and description");
    }

    const authType = String(data.auth_requirements.type);
    if (!validAuthTypes.includes(authType)) {
        throw new Error(`Invalid auth type. Must be one of: ${validAuthTypes.join(", ")}`);
    }

    const authRequirements: AuthRequirement = {
        type: authType as AuthRequirement["type"],
        description: String(data.auth_requirements.description)
    };

    // Create and validate API blueprint data object
    const apiBlueprintData: APIBlueprintData = {
        api_id: String(data.api_id),
        api_name: String(data.api_name),
        api_version: String(data.api_version),
        description: String(data.description),
        endpoints: endpoints,
        auth_requirements: authRequirements,
        draft_number: Number(data.draft_number),
        total_drafts: Number(data.total_drafts),
        next_step_needed: Boolean(data.next_step_needed)
    };

    // Optional fields
    if ("is_critique" in data) apiBlueprintData.is_critique = Boolean(data.is_critique);
    if ("critique_focus" in data) apiBlueprintData.critique_focus = String(data.critique_focus);
    if ("revision_instructions" in data) apiBlueprintData.revision_instructions = String(data.revision_instructions);
    if ("is_final_draft" in data) apiBlueprintData.is_final_draft = Boolean(data.is_final_draft);

    // Additional validations
    if (apiBlueprintData.draft_number <= 0) {
        throw new Error("Draft number must be positive");
    }

    if (apiBlueprintData.total_drafts <= 0) {
        throw new Error("Total drafts must be positive");
    }

    if (apiBlueprintData.draft_number > apiBlueprintData.total_drafts) {
        throw new Error("Draft number cannot exceed total drafts");
    }

    // Validate critique-specific fields
    if (apiBlueprintData.is_critique && !apiBlueprintData.critique_focus) {
        throw new Error("Critique focus required when is_critique is true");
    }

    // Validate revision-specific fields
    if (apiBlueprintData.is_critique === false && !apiBlueprintData.revision_instructions) {
        throw new Error("Revision instructions required when is_critique is false");
    }

    return apiBlueprintData;
}

const formatAPIBlueprint = (api: APIBlueprintData): string => {
    return JSON.stringify({
        apiId: api.api_id,
        apiName: api.api_name,
        apiVersion: api.api_version,
        description: api.description,
        endpoints: api.endpoints.map(ep => ({
            path: ep.path,
            method: ep.method,
            description: ep.description,
            parameterCount: ep.parameters.length,
            responseCount: ep.responses.length
        })),
        authType: api.auth_requirements.type,
        draftNumber: api.draft_number
    }, null, 2);
}