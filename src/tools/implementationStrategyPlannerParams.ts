import { z } from "zod";

export const TOOL_NAME = "implementation-strategy-planner";

export const TOOL_PARAM_DESCRIPTIONS = {
    strategy_id: "Unique identifier for the implementation strategy.",
    
    feature_name: "Name of the feature or component being implemented.",
    
    feature_description: "Detailed description of the feature or component to be implemented.",
    
    implementation_approaches: "Array of potential implementation approaches, each with phases, tasks, risks, and trade-offs.",
    
    selected_approach: "The name of the approach selected from the implementation_approaches array (optional until a decision is made).",
    
    dependencies: "Array of dependencies required for this implementation (other features, components, or external systems).",
    
    constraints: "Array of constraints that impact the implementation (time, resources, technical limitations).",
    
    success_criteria: "Array of criteria that define successful implementation.",
    
    draft_number: "Current draft number in the iteration sequence (must be >= 1). Increments with each new critique or revision.",
    
    total_drafts: "Estimated total number of drafts needed to reach a complete implementation strategy (must be >= draft_number).",
    
    is_critique: "Boolean flag indicating whether the current step is a critique phase (true) evaluating the strategy, or a revision phase (false) implementing improvements.",
    
    critique_focus: "The specific aspect being critiqued in the current evaluation (e.g., 'feasibility', 'risk_assessment', 'resource_allocation', 'timeline'). Required when is_critique is true.",
    
    revision_instructions: "Detailed, actionable guidance for how to revise the implementation strategy based on the preceding critique. Required when is_critique is false.",
    
    next_step_needed: "Boolean flag indicating whether another critique or revision cycle is needed. Set to false only when the final implementation strategy is complete.",
    
    is_final_draft: "Boolean flag indicating whether this is the final draft of the implementation strategy."
};

export const TOOL_SCHEMA = {
    strategy_id: z.string()
        .min(1, "Strategy ID cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.strategy_id),
    
    feature_name: z.string()
        .min(1, "Feature name cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.feature_name),
    
    feature_description: z.string()
        .min(1, "Feature description cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.feature_description),
    
    implementation_approaches: z.array(
        z.object({
            name: z.string().min(1, "Approach name cannot be empty"),
            description: z.string().min(1, "Approach description cannot be empty"),
            phases: z.array(
                z.object({
                    name: z.string().min(1, "Phase name cannot be empty"),
                    description: z.string(),
                    tasks: z.array(z.string().min(1, "Task cannot be empty")),
                    estimated_effort: z.number().min(0, "Effort estimate cannot be negative"),
                    risks: z.array(
                        z.object({
                            description: z.string().min(1, "Risk description cannot be empty"),
                            mitigation: z.string().min(1, "Risk mitigation cannot be empty"),
                            impact: z.enum(["low", "medium", "high"])
                        })
                    ),
                    dependencies: z.array(z.string())
                })
            ),
            pros: z.array(z.string().min(1, "Pro cannot be empty")),
            cons: z.array(z.string().min(1, "Con cannot be empty"))
        })
    ).min(1, "At least one implementation approach is required")
    .describe(TOOL_PARAM_DESCRIPTIONS.implementation_approaches),
    
    selected_approach: z.string()
        .optional()
        .describe(TOOL_PARAM_DESCRIPTIONS.selected_approach),
    
    dependencies: z.array(
        z.object({
            name: z.string().min(1, "Dependency name cannot be empty"),
            description: z.string(),
            type: z.enum(["feature", "component", "system", "external", "other"]),
            status: z.enum(["not_started", "in_progress", "completed", "blocked"])
        })
    ).describe(TOOL_PARAM_DESCRIPTIONS.dependencies),
    
    constraints: z.array(
        z.object({
            category: z.enum(["time", "resource", "technical", "organizational", "other"]),
            description: z.string().min(1, "Constraint description cannot be empty"),
            impact: z.enum(["low", "medium", "high"])
        })
    ).describe(TOOL_PARAM_DESCRIPTIONS.constraints),
    
    success_criteria: z.array(
        z.string().min(1, "Success criterion cannot be empty")
    ).describe(TOOL_PARAM_DESCRIPTIONS.success_criteria),
    
    draft_number: z.number()
        .min(1, "Draft number must be at least 1")
        .describe(TOOL_PARAM_DESCRIPTIONS.draft_number),
    
    total_drafts: z.number()
        .min(1, "Total drafts must be at least 1")
        .describe(TOOL_PARAM_DESCRIPTIONS.total_drafts),
    
    is_critique: z.boolean()
        .optional()
        .describe(TOOL_PARAM_DESCRIPTIONS.is_critique),
    
    critique_focus: z.string()
        .min(1, "Critique focus cannot be empty")
        .optional()
        .describe(TOOL_PARAM_DESCRIPTIONS.critique_focus),
    
    revision_instructions: z.string()
        .min(1, "Revision instructions cannot be empty")
        .optional()
        .describe(TOOL_PARAM_DESCRIPTIONS.revision_instructions),
    
    next_step_needed: z.boolean()
        .describe(TOOL_PARAM_DESCRIPTIONS.next_step_needed),
    
    is_final_draft: z.boolean()
        .optional()
        .describe(TOOL_PARAM_DESCRIPTIONS.is_final_draft)
};

export const TOOL_DESCRIPTION = `
    # Implementation Strategy Planner: Structured Development Roadmapping

    A tool that facilitates planning, critiquing, and refining implementation approaches for features or components.

    ## When to Use This Tool:
    - **Feature Planning:** Breaking down complex features into implementation steps
    - **Refactoring Planning:** Mapping out staged approaches to code improvement
    - **Risk Mitigation:** Identifying and addressing implementation risks
    - **Resource Allocation:** Planning how to distribute development effort
    - **Technical Spike Planning:** Designing exploratory implementation investigations
    - **Legacy System Modernization:** Planning phased replacement strategies

    ## Key Capabilities:
    - **Task Breakdown:** Segments implementation into discrete, manageable tasks
    - **Dependency Mapping:** Identifies dependencies between implementation steps
    - **Risk Assessment:** Highlights potential implementation challenges and contingencies
    - **Phasing Strategy:** Organizes implementation into logical phases or iterations
    - **Test Strategy Integration:** Plans testing approaches for each implementation stage
    - **Effort Estimation:** Provides structured approach to implementation sizing
    - **Alternative Evaluation:** Compares different implementation approaches

    ## Parameters Explained:
    - **strategy_id:** Unique identifier for the implementation strategy.
    
    - **feature_name:** Clear, descriptive name for the feature or component being implemented.
    
    - **feature_description:** Comprehensive explanation of what is being implemented and why.
    
    - **implementation_approaches:** Array of potential implementation strategies, each containing:
      * "name": Descriptive name for the approach
      * "description": Overview of the implementation approach
      * "phases": Array of implementation phases, each with tasks, risks, and dependencies
      * "pros": Benefits of this implementation approach
      * "cons": Drawbacks or challenges of this implementation approach
    
    - **selected_approach:** Name of the chosen implementation approach (once decided).
    
    - **dependencies:** Array of external dependencies required for implementation:
      * "name": Name of the dependency
      * "description": What the dependency provides
      * "type": Category of dependency (feature, component, system, external, other)
      * "status": Current state of the dependency
    
    - **constraints:** Array of limitations that impact implementation:
      * "category": Type of constraint (time, resource, technical, organizational, other)
      * "description": Details about the constraint
      * "impact": How severely this constraint affects implementation
    
    - **success_criteria:** Array of measurable conditions that define successful implementation.
    
    - **draft_number:** Current draft number in the iteration sequence (starting from 1).
    
    - **total_drafts:** Estimated total number of drafts needed to reach a complete implementation strategy.
    
    - **is_critique:** Boolean indicating the current mode:
      * true = Evaluating the current implementation strategy
      * false = Implementing revisions
    
    - **critique_focus:** (Required when is_critique=true) Specific aspect being evaluated, such as:
      * "feasibility": Assessing whether the approach is technically viable
      * "risk_assessment": Evaluating identified risks and mitigations
      * "resource_allocation": Analyzing how resources are distributed
      * "timeline": Evaluating the proposed implementation schedule
      * "dependency_management": Assessing how dependencies are handled
    
    - **revision_instructions:** (Required when is_critique=false) Detailed guidance for improving the implementation strategy based on the preceding critique.
    
    - **next_step_needed:** Boolean flag indicating whether another critique or revision cycle is needed.
    
    - **is_final_draft:** (Optional) Boolean indicating whether this is the final iteration of the implementation strategy.

    ## Best Practice Workflow:
    1. **Start with Initial Draft:** Begin with a basic implementation strategy that outlines the feature and potential approaches.
    
    2. **Alternate Critique and Revision:** Use is_critique=true to evaluate the strategy, then is_critique=false to implement improvements.
    
    3. **Focus Each Critique:** Choose a specific critique_focus for each evaluation cycle rather than attempting to address everything at once.
    
    4. **Provide Detailed Revision Guidance:** Include specific, actionable revision_instructions based on each critique.
    
    5. **Refine Phase Decomposition:** Ensure implementation phases are logical, manageable, and properly sequenced.
    
    6. **Develop Comprehensive Risk Management:** Identify risks and provide specific mitigation strategies.
    
    7. **Clarify Decision Criteria:** When comparing approaches, provide clear criteria for selection.
    
    8. **Define Concrete Success Criteria:** Ensure success measures are specific and measurable.

    ## Example Application:
    - **Initial Draft:** Basic strategy outlining feature and possible implementation approaches
    - **Critique #1:** Focus on approach completeness to identify missing steps or considerations
    - **Revision #1:** Expand approaches with more detailed phases and tasks
    - **Critique #2:** Focus on risk assessment to ensure potential issues are addressed
    - **Revision #2:** Enhance risk identification and mitigation strategies
    - **Critique #3:** Focus on resource allocation and timeline feasibility
    - **Revision #3:** Adjust effort estimates and phase dependencies
    - **Final Review:** Holistic evaluation to ensure readiness for implementation
    - **Final Revision:** Select final approach and refine implementation details

    Implementation Strategy Planner is particularly valuable for complex features that require careful planning and risk management, providing a structured framework for breaking down implementation into manageable components with clear dependencies and success criteria.
`;
