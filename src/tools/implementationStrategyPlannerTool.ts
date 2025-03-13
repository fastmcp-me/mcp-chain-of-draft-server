import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_SCHEMA, TOOL_DESCRIPTION } from "./implementationStrategyPlannerParams.js";
import { logger } from "../utils/logging.js";

interface Risk {
    description: string;
    mitigation: string;
    impact: "low" | "medium" | "high";
}

interface Phase {
    name: string;
    description: string;
    tasks: string[];
    estimated_effort: number;
    risks: Risk[];
    dependencies: string[];
}

interface ImplementationApproach {
    name: string;
    description: string;
    phases: Phase[];
    pros: string[];
    cons: string[];
}

interface Dependency {
    name: string;
    description: string;
    type: "feature" | "component" | "system" | "external" | "other";
    status: "not_started" | "in_progress" | "completed" | "blocked";
}

interface Constraint {
    category: "time" | "resource" | "technical" | "organizational" | "other";
    description: string;
    impact: "low" | "medium" | "high";
}

interface ImplementationStrategyData {
    // Required fields
    strategy_id: string;
    feature_name: string;
    feature_description: string;
    implementation_approaches: ImplementationApproach[];
    dependencies: Dependency[];
    constraints: Constraint[];
    success_criteria: string[];
    draft_number: number;
    total_drafts: number;
    next_step_needed: boolean;

    // Optional fields
    selected_approach?: string;
    is_critique?: boolean;
    critique_focus?: string;
    revision_instructions?: string;
    is_final_draft?: boolean;
}

const strategyHistory: Record<string, ImplementationStrategyData[]> = {};
const activeCritiques: Record<string, string[]> = {};

export const implementationStrategyPlannerTool = (server: McpServer): void => {
    const processStrategyRequest = async (input: unknown) => {
        try {
            const validatedInput = validateImplementationStrategyData(input);
            if (!validatedInput) {
                throw new McpError(ErrorCode.InvalidParams, "Invalid implementation strategy data");
            }

            // Validate draft progression
            if (validatedInput.draft_number > validatedInput.total_drafts) {
                validatedInput.total_drafts = validatedInput.draft_number;
            }

            // Initialize history for this strategy if needed
            const strategyId = validatedInput.strategy_id;
            if (!strategyHistory[strategyId]) {
                strategyHistory[strategyId] = [];
            }

            // Store the implementation strategy in history
            strategyHistory[strategyId].push(validatedInput);

            // Handle critique tracking
            if (validatedInput.is_critique && validatedInput.critique_focus) {
                if (!activeCritiques[strategyId]) {
                    activeCritiques[strategyId] = [];
                }
                activeCritiques[strategyId].push(validatedInput.critique_focus);
            }

            // Format response
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        strategyId: validatedInput.strategy_id,
                        featureName: validatedInput.feature_name,
                        draftNumber: validatedInput.draft_number,
                        totalDrafts: validatedInput.total_drafts,
                        approachCount: validatedInput.implementation_approaches.length,
                        selectedApproach: validatedInput.selected_approach,
                        nextStepNeeded: validatedInput.next_step_needed,
                        isCritique: validatedInput.is_critique,
                        critiqueFocus: validatedInput.critique_focus,
                        revisionInstructions: validatedInput.revision_instructions,
                        activeCritiques: activeCritiques[strategyId] || [],
                        strategyHistoryLength: strategyHistory[strategyId].length,
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
                text: JSON.stringify(await processStrategyRequest(args))
            }]
        })
    );
}

const validateImplementationStrategyData = (input: unknown): ImplementationStrategyData | null => {
    const data = input as Record<string, unknown>;

    // Check required fields first
    if (typeof data !== "object" || data === null ||
        !("strategy_id" in data) ||
        !("feature_name" in data) ||
        !("feature_description" in data) ||
        !("implementation_approaches" in data) ||
        !("dependencies" in data) ||
        !("constraints" in data) ||
        !("success_criteria" in data) ||
        !("draft_number" in data) ||
        !("total_drafts" in data) ||
        !("next_step_needed" in data)) {
        throw new Error("Missing required fields");
    }

    // Validate approaches
    if (!Array.isArray(data.implementation_approaches)) {
        throw new Error("Implementation approaches must be an array");
    }

    const validImpactLevels = ["low", "medium", "high"];
    const validDependencyTypes = ["feature", "component", "system", "external", "other"];
    const validDependencyStatuses = ["not_started", "in_progress", "completed", "blocked"];
    const validConstraintCategories = ["time", "resource", "technical", "organizational", "other"];

    const approaches: ImplementationApproach[] = [];
    for (const approach of data.implementation_approaches) {
        if (typeof approach !== "object" || approach === null ||
            !("name" in approach) ||
            !("description" in approach) ||
            !("phases" in approach) ||
            !("pros" in approach) ||
            !("cons" in approach)) {
            throw new Error("Each approach must have name, description, phases, pros, and cons");
        }

        // Validate phases
        if (!Array.isArray(approach.phases)) {
            throw new Error("Phases must be an array");
        }

        const phases: Phase[] = [];
        for (const phase of approach.phases) {
            if (typeof phase !== "object" || phase === null ||
                !("name" in phase) ||
                !("description" in phase) ||
                !("tasks" in phase) ||
                !("estimated_effort" in phase) ||
                !("risks" in phase) ||
                !("dependencies" in phase)) {
                throw new Error("Each phase must have name, description, tasks, estimated_effort, risks, and dependencies");
            }

            // Validate tasks
            if (!Array.isArray(phase.tasks)) {
                throw new Error("Tasks must be an array");
            }

            // Validate risks
            if (!Array.isArray(phase.risks)) {
                throw new Error("Risks must be an array");
            }

            const risks: Risk[] = [];
            for (const risk of phase.risks) {
                if (typeof risk !== "object" || risk === null ||
                    !("description" in risk) ||
                    !("mitigation" in risk) ||
                    !("impact" in risk)) {
                    throw new Error("Each risk must have description, mitigation, and impact");
                }

                // Validate impact
                if (!validImpactLevels.includes(String(risk.impact))) {
                    throw new Error(`Invalid impact level. Must be one of: ${validImpactLevels.join(", ")}`);
                }

                risks.push({
                    description: String(risk.description),
                    mitigation: String(risk.mitigation),
                    impact: String(risk.impact) as Risk["impact"]
                });
            }

            // Validate dependencies
            if (!Array.isArray(phase.dependencies)) {
                throw new Error("Dependencies must be an array");
            }

            phases.push({
                name: String(phase.name),
                description: String(phase.description),
                tasks: Array.isArray(phase.tasks) ? phase.tasks.map((t: unknown) => String(t)) : [],
                estimated_effort: Number(phase.estimated_effort),
                risks: risks,
                dependencies: Array.isArray(phase.dependencies) ? phase.dependencies.map((d: unknown) => String(d)) : []
            });
        }

        approaches.push({
            name: String(approach.name),
            description: String(approach.description),
            phases: phases,
            pros: Array.isArray(approach.pros) ? approach.pros.map((p: unknown) => String(p)) : [],
            cons: Array.isArray(approach.cons) ? approach.cons.map((c: unknown) => String(c)) : []
        });
    }

    // Validate dependencies
    if (!Array.isArray(data.dependencies)) {
        throw new Error("Dependencies must be an array");
    }

    const dependencies: Dependency[] = [];
    for (const dep of data.dependencies) {
        if (typeof dep !== "object" || dep === null ||
            !("name" in dep) ||
            !("description" in dep) ||
            !("type" in dep) ||
            !("status" in dep)) {
            throw new Error("Each dependency must have name, description, type, and status");
        }

        // Validate type
        if (!validDependencyTypes.includes(String(dep.type))) {
            throw new Error(`Invalid dependency type. Must be one of: ${validDependencyTypes.join(", ")}`);
        }

        // Validate status
        if (!validDependencyStatuses.includes(String(dep.status))) {
            throw new Error(`Invalid dependency status. Must be one of: ${validDependencyStatuses.join(", ")}`);
        }

        dependencies.push({
            name: String(dep.name),
            description: String(dep.description),
            type: String(dep.type) as Dependency["type"],
            status: String(dep.status) as Dependency["status"]
        });
    }

    // Validate constraints
    if (!Array.isArray(data.constraints)) {
        throw new Error("Constraints must be an array");
    }

    const constraints: Constraint[] = [];
    for (const constraint of data.constraints) {
        if (typeof constraint !== "object" || constraint === null ||
            !("category" in constraint) ||
            !("description" in constraint) ||
            !("impact" in constraint)) {
            throw new Error("Each constraint must have category, description, and impact");
        }

        // Validate category
        if (!validConstraintCategories.includes(String(constraint.category))) {
            throw new Error(`Invalid constraint category. Must be one of: ${validConstraintCategories.join(", ")}`);
        }

        // Validate impact
        if (!validImpactLevels.includes(String(constraint.impact))) {
            throw new Error(`Invalid impact level. Must be one of: ${validImpactLevels.join(", ")}`);
        }

        constraints.push({
            category: String(constraint.category) as Constraint["category"],
            description: String(constraint.description),
            impact: String(constraint.impact) as Constraint["impact"]
        });
    }

    // Validate success criteria
    if (!Array.isArray(data.success_criteria)) {
        throw new Error("Success criteria must be an array");
    }

    // Create and validate implementation strategy data object
    const strategyData: ImplementationStrategyData = {
        strategy_id: String(data.strategy_id),
        feature_name: String(data.feature_name),
        feature_description: String(data.feature_description),
        implementation_approaches: approaches,
        dependencies: dependencies,
        constraints: constraints,
        success_criteria: Array.isArray(data.success_criteria) ? data.success_criteria.map(sc => String(sc)) : [],
        draft_number: Number(data.draft_number),
        total_drafts: Number(data.total_drafts),
        next_step_needed: Boolean(data.next_step_needed)
    };

    // Optional fields
    if ("selected_approach" in data) strategyData.selected_approach = String(data.selected_approach);
    if ("is_critique" in data) strategyData.is_critique = Boolean(data.is_critique);
    if ("critique_focus" in data) strategyData.critique_focus = String(data.critique_focus);
    if ("revision_instructions" in data) strategyData.revision_instructions = String(data.revision_instructions);
    if ("is_final_draft" in data) strategyData.is_final_draft = Boolean(data.is_final_draft);

    // Additional validations
    if (strategyData.draft_number <= 0) {
        throw new Error("Draft number must be positive");
    }

    if (strategyData.total_drafts <= 0) {
        throw new Error("Total drafts must be positive");
    }

    if (strategyData.draft_number > strategyData.total_drafts) {
        throw new Error("Draft number cannot exceed total drafts");
    }

    // Validate critique-specific fields
    if (strategyData.is_critique && !strategyData.critique_focus) {
        throw new Error("Critique focus required when is_critique is true");
    }

    // Validate revision-specific fields
    if (strategyData.is_critique === false && !strategyData.revision_instructions) {
        throw new Error("Revision instructions required when is_critique is false");
    }

    // Validate selected approach
    if (strategyData.selected_approach) {
        const approachNames = strategyData.implementation_approaches.map(a => a.name);
        if (!approachNames.includes(strategyData.selected_approach)) {
            throw new Error(`Selected approach '${strategyData.selected_approach}' not found in implementation approaches`);
        }
    }

    return strategyData;
}

const formatImplementationStrategy = (strategy: ImplementationStrategyData): string => {
    return JSON.stringify({
        strategyId: strategy.strategy_id,
        featureName: strategy.feature_name,
        selectedApproach: strategy.selected_approach,
        approachCount: strategy.implementation_approaches.length,
        dependencyCount: strategy.dependencies.length,
        constraintCount: strategy.constraints.length,
        successCriteriaCount: strategy.success_criteria.length,
        draftNumber: strategy.draft_number
    }, null, 2);
}
