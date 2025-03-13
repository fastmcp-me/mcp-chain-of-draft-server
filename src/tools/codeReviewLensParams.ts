import { z } from "zod";

export const TOOL_NAME = "code-review-lens";

export const TOOL_PARAM_DESCRIPTIONS = {
    review_id: "Unique identifier for the code review session.",
    
    pull_request_id: "Identifier of the pull request or code submission being reviewed.",
    
    repository: "Name of the repository containing the code being reviewed.",
    
    review_dimensions: "Array of review focus areas (e.g., performance, security, readability).",
    
    files: "Array of files being reviewed, including content and metadata.",
    
    findings: "Array of review findings, including location, severity, and description.",
    
    draft_number: "Current draft number in the review iteration sequence (must be >= 1). Increments with each new critique or revision.",
    
    total_drafts: "Estimated total number of drafts needed to complete the review (must be >= draft_number).",
    
    is_critique: "Boolean flag indicating whether the current step is a critique phase (true) evaluating the code review, or a revision phase (false) implementing improvements.",
    
    critique_focus: "The specific aspect being critiqued in the current evaluation (e.g., 'completeness', 'accuracy', 'actionability'). Required when is_critique is true.",
    
    revision_instructions: "Detailed, actionable guidance for how to revise the code review based on the preceding critique. Required when is_critique is false.",
    
    next_step_needed: "Boolean flag indicating whether another critique or revision cycle is needed. Set to false only when the final code review is complete.",
    
    is_final_draft: "Boolean flag indicating whether this is the final draft of the code review."
};

export const TOOL_SCHEMA = {
    review_id: z.string()
        .min(1, "Review ID cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.review_id),
    
    pull_request_id: z.string()
        .min(1, "Pull request ID cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.pull_request_id),
    
    repository: z.string()
        .min(1, "Repository name cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.repository),
    
    review_dimensions: z.array(
        z.enum(["performance", "security", "maintainability", "readability", "testability", "correctness", "documentation"])
    ).min(1, "At least one review dimension is required")
    .describe(TOOL_PARAM_DESCRIPTIONS.review_dimensions),
    
    files: z.array(
        z.object({
            path: z.string().min(1, "File path cannot be empty"),
            content: z.string(),
            language: z.string(),
            line_count: z.number().int().min(0, "Line count cannot be negative")
        })
    ).describe(TOOL_PARAM_DESCRIPTIONS.files),
    
    findings: z.array(
        z.object({
            file: z.string().min(1, "File path cannot be empty"),
            line_range: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
            dimension: z.enum(["performance", "security", "maintainability", "readability", "testability", "correctness", "documentation"]),
            severity: z.enum(["info", "suggestion", "warning", "critical"]),
            description: z.string().min(1, "Finding description cannot be empty"),
            suggested_fix: z.string().optional(),
            justification: z.string().optional()
        })
    ).describe(TOOL_PARAM_DESCRIPTIONS.findings),
    
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
    # Code Review Lens: Multi-Perspective Code Evaluation

    A tool that facilitates structured, multi-dimensional code review through guided critique and improvement cycles.

    ## When to Use This Tool:
    - **Pre-submission Review:** Evaluating code before formal review submission
    - **Team Code Reviews:** Guiding team review process with structured approach
    - **Knowledge Transfer:** Capturing review insights for team learning
    - **Maintenance Readiness:** Evaluating code readiness for long-term maintenance
    - **Standard Compliance:** Verifying adherence to team coding standards
    - **Cross-training:** Helping reviewers evaluate code outside their expertise

    ## Key Capabilities:
    - **Multi-dimensional Analysis:** Examines code from different perspectives (performance, security, maintainability)
    - **Contextual Guidance:** Provides review focus appropriate to the code's purpose
    - **Pattern Recognition:** Identifies common code issues and improvement opportunities
    - **Progressive Depth:** Supports layered review from superficial to deep analysis
    - **Review Consistency:** Ensures consistent evaluation across different reviewers
    - **Learning Integration:** Connects review findings to learning resources
    - **Suggestion Refinement:** Iteratively improves change recommendations

    ## Parameters Explained:
    - **review_id:** Unique identifier for the code review session.
    
    - **pull_request_id:** Identifier of the pull request or code submission being reviewed.
    
    - **repository:** Name of the repository containing the code being reviewed.
    
    - **review_dimensions:** Array of specific aspects being evaluated in the review:
      * "performance": Analyzing code efficiency and resource usage
      * "security": Identifying security vulnerabilities and risks
      * "maintainability": Evaluating long-term code maintainability
      * "readability": Assessing how easily the code can be understood
      * "testability": Determining how well the code can be tested
      * "correctness": Verifying logical correctness and bug absence
      * "documentation": Evaluating code comments and documentation
    
    - **files:** Array of files being reviewed, each containing:
      * "path": File location within the repository
      * "content": Actual code content being reviewed
      * "language": Programming language of the file
      * "line_count": Number of lines in the file
    
    - **findings:** Array of review observations, each containing:
      * "file": Path to the file containing the finding
      * "line_range": Start and end line numbers [start, end]
      * "dimension": Which review dimension this finding relates to
      * "severity": Importance level (info, suggestion, warning, critical)
      * "description": Explanation of the issue or observation
      * "suggested_fix": Optional code suggestion to address the finding
      * "justification": Optional explanation of why this is a concern
    
    - **draft_number:** Current draft number in the review iteration sequence (starting from 1).
    
    - **total_drafts:** Estimated total number of review drafts needed.
    
    - **is_critique:** Boolean indicating the current mode:
      * true = Evaluating the current code review
      * false = Implementing revisions to the review
    
    - **critique_focus:** (Required when is_critique=true) Specific aspect being evaluated, such as:
      * "completeness": Ensuring all important code aspects are reviewed
      * "accuracy": Verifying correctness of findings
      * "actionability": Assessing how actionable the feedback is
      * "prioritization": Evaluating the emphasis on the most important issues
    
    - **revision_instructions:** (Required when is_critique=false) Detailed guidance for improving the code review based on the preceding critique.
    
    - **next_step_needed:** Boolean flag indicating whether another critique or revision cycle is needed.
    
    - **is_final_draft:** (Optional) Boolean indicating whether this is the final iteration of the code review.

    ## Best Practice Workflow:
    1. **Start with Initial Draft:** Begin with a basic code review that identifies key issues across selected dimensions.
    
    2. **Alternate Critique and Revision:** Use is_critique=true to evaluate the review, then is_critique=false to implement improvements.
    
    3. **Focus Each Critique:** Choose a specific critique_focus for each evaluation cycle rather than attempting to address everything at once.
    
    4. **Provide Detailed Revision Guidance:** Include specific, actionable revision_instructions based on each critique.
    
    5. **Prioritize Findings:** Ensure the most critical issues receive appropriate emphasis and detail.
    
    6. **Include Actionable Suggestions:** Provide specific fixes or improvements for identified issues.
    
    7. **Balance Positive and Negative Feedback:** Highlight both problematic areas and well-implemented code.
    
    8. **Consider Educational Value:** Frame findings to promote learning and improvement.

    ## Example Application:
    - **Initial Draft:** Basic code review focusing on most obvious issues
    - **Critique #1:** Focus on completeness to identify missing review dimensions
    - **Revision #1:** Expand review to cover additional code aspects
    - **Critique #2:** Focus on actionability of the feedback
    - **Revision #2:** Enhance suggestions with specific code examples
    - **Critique #3:** Focus on balancing criticism with positive reinforcement
    - **Revision #3:** Add recognition of well-implemented patterns
    - **Final Review:** Holistic evaluation of the complete code review
    - **Final Revision:** Polish and finalize the review for submission

    Code Review Lens is particularly valuable for elevating the quality of code reviews beyond simple issue-spotting to comprehensive, educational, and actionable feedback that improves both the code and the developer.
`;
