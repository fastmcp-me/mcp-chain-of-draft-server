import { z } from "zod";

export const TOOL_NAME = "architecture-decision-recorder";

// Detailed parameter descriptions
export const TOOL_PARAM_DESCRIPTIONS = {
    id: "Unique identifier for the architecture decision record (ADR).",
    
    title: "Concise title that summarizes the architectural decision being made.",
    
    status: "Current status of the architecture decision (proposed, accepted, rejected, deprecated, superseded).",
    
    context: "Background information explaining the forces at play and the problem being solved that led to this decision.",
    
    decision: "The current decision statement describing the selected architectural approach.",
    
    consequences: "Array of resulting consequences (positive, negative, and neutral) from applying this decision.",
    
    alternatives: "Array of alternative options considered, each with pros and cons.",
    
    related_decisions: "Array of identifiers for related architecture decisions.",
    
    draft_number: "Current draft number in the iteration sequence (must be >= 1). Increments with each new critique or revision.",
    
    total_drafts: "Estimated total number of drafts needed to reach a complete decision (must be >= draft_number). Can be adjusted as the process evolves.",
    
    is_critique: "Boolean flag indicating whether the current step is a critique phase (true) evaluating previous decision, or a revision phase (false) implementing improvements.",
    
    critique_focus: "The specific aspect or dimension being critiqued in the current evaluation (e.g., 'completeness', 'consistency', 'feasibility', 'risks'). Required when is_critique is true.",
    
    revision_instructions: "Detailed, actionable guidance for how to revise the decision based on the preceding critique. Should directly address issues identified in the critique. Required when is_critique is false.",
    
    is_final_draft: "Boolean flag indicating whether this is the final draft in the decision process. Helps signal the completion of the iterative refinement.",
};

export const TOOL_SCHEMA = {
    id: z.string()
        .min(1, "ID cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.id),

    title: z.string()
        .min(1, "Title cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.title),

    status: z.enum(["proposed", "accepted", "rejected", "deprecated", "superseded"])
        .describe(TOOL_PARAM_DESCRIPTIONS.status),

    context: z.string()
        .min(1, "Context cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.context),

    decision: z.string()
        .min(1, "Decision cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.decision),

    consequences: z.array(z.string().min(1, "Consequence cannot be empty"))
        .describe(TOOL_PARAM_DESCRIPTIONS.consequences),

    alternatives: z.array(
        z.object({
            option: z.string().min(1, "Alternative option cannot be empty"),
            pros: z.array(z.string()),
            cons: z.array(z.string())
        })
    ).describe(TOOL_PARAM_DESCRIPTIONS.alternatives),

    related_decisions: z.array(z.string())
        .describe(TOOL_PARAM_DESCRIPTIONS.related_decisions),

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

    is_final_draft: z.boolean()
        .optional()
        .describe(TOOL_PARAM_DESCRIPTIONS.is_final_draft),
};

export const TOOL_DESCRIPTION = `
    # Architecture Decision Recorder: Structured Decision Management

    A tool that facilitates the creation, evaluation, and refinement of Architecture Decision Records (ADRs) through iterative critique and revision cycles.

    ## When to Use This Tool:
    - **Key Design Decisions:** When making significant architectural choices that impact multiple components
    - **Technology Selection:** Evaluating and selecting frameworks, libraries, or platforms
    - **Pattern Application:** Deciding which architectural patterns to implement
    - **Trade-off Analysis:** Balancing competing concerns (performance, maintainability, security)
    - **Cross-cutting Concerns:** Handling authentication, logging, caching strategies
    - **API Design:** Establishing API boundaries and communication patterns

    ## Key Capabilities:
    - **Decision Templating:** Provides structured templates for documenting decisions
    - **Alternative Analysis:** Systematically evaluates multiple approaches against criteria
    - **Consequence Mapping:** Identifies impacts of decisions on different system aspects
    - **Context Preservation:** Records the circumstances and constraints influencing decisions
    - **Iterative Refinement:** Supports critique and revision cycles for decision records
    - **Historical Context:** Maintains decision history with evolving understanding
    - **Traceability:** Links decisions to requirements, constraints, and other decisions

    ## Parameters Explained:
    - **id:** Unique identifier for the architecture decision record.
    
    - **title:** Concise title that summarizes the architectural decision being made.
    
    - **status:** Current status of the architecture decision:
      * "proposed": Under consideration, not yet accepted
      * "accepted": Approved and in effect
      * "rejected": Considered and explicitly declined
      * "deprecated": Once accepted but no longer recommended
      * "superseded": Replaced by a newer decision
    
    - **context:** Background information explaining the forces at play and the problem being solved.
    
    - **decision:** The current decision statement describing the selected architectural approach.
    
    - **consequences:** Array of resulting consequences from applying this decision, including benefits, trade-offs, and risks.
    
    - **alternatives:** Array of alternative options that were considered, each with pros and cons.
    
    - **related_decisions:** Array of identifiers for related architecture decisions that influenced or are influenced by this one.
    
    - **draft_number:** Integer tracking the current iteration (starting from 1). Increments with each critique or revision.
    
    - **total_drafts:** Estimated number of drafts needed for completion. This can be adjusted as the decision process evolves.
    
    - **is_critique:** Boolean indicating the current mode:
      * true = Evaluating previous decision draft
      * false = Implementing revisions
    
    - **critique_focus:** (Required when is_critique=true) Specific aspect being evaluated, such as:
      * "completeness": Ensuring all relevant factors are considered
      * "consistency": Checking for alignment with other decisions and principles
      * "feasibility": Evaluating practical implementation challenges
      * "risks": Identifying potential negative consequences
    
    - **revision_instructions:** (Required when is_critique=false) Detailed guidance for improving the decision based on the preceding critique.
    
    - **is_final_draft:** (Optional) Boolean indicating whether this is the final iteration of the decision.

    ## Best Practice Workflow:
    1. **Start with Initial Draft:** Begin with a first-pass decision record and set a reasonable total_drafts (typically 3-5).
    
    2. **Alternate Critique and Revision:** Use is_critique=true to evaluate the decision, then is_critique=false to implement improvements.
    
    3. **Focus Each Critique:** Choose a specific critique_focus for each evaluation cycle rather than attempting to address everything at once.
    
    4. **Provide Detailed Revision Guidance:** Include specific, actionable revision_instructions based on each critique.
    
    5. **Consider Multiple Perspectives:** Ensure critiques come from different stakeholder perspectives (developers, operators, users).
    
    6. **Document Alternatives Thoroughly:** Even rejected alternatives should be well-documented with their pros and cons.
    
    7. **Mark Completion Appropriately:** Set is_final_draft=true only when the decision record is complete and ready for implementation.
    
    8. **Revisit as Needed:** Architecture decisions can be reopened if circumstances change significantly.

    ## Example Application:
    - **Initial Draft:** Basic decision outline with context and preliminary choice
    - **Critique #1:** Focus on completeness and identify missing considerations
    - **Revision #1:** Address gaps in the decision context and rationale
    - **Critique #2:** Focus on risks and identify potential negative consequences
    - **Revision #2:** Add risk mitigation strategies to the decision
    - **Final Critique:** Holistic review of consistency with other architectural decisions
    - **Final Revision:** Refine presentation and ensure alignment with overall architecture

    Architecture Decision Recorder is particularly effective for capturing and refining significant design decisions in a collaborative environment. By providing structure and promoting iterative improvement, it leads to better-reasoned and better-documented architectural choices.
`;
