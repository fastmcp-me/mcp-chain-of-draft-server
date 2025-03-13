import { z } from "zod";

export const TOOL_NAME = "api-blueprint-designer";

// Detailed parameter descriptions
export const TOOL_PARAM_DESCRIPTIONS = {
    api_id: "Unique identifier for the API being designed.",
    
    name: "Name of the API or endpoint being designed.",
    
    path: "URL path pattern for the endpoint (e.g., '/users/{id}').",
    
    method: "HTTP method for the endpoint (GET, POST, PUT, DELETE, PATCH).",
    
    description: "Detailed description of the endpoint's purpose and behavior.",
    
    request_params: "Array of request parameters (query parameters, path parameters) with name, type, required status, and description.",
    
    request_body: "Schema and example for the request body, if applicable.",
    
    responses: "Array of possible responses with status codes, descriptions, and examples.",
    
    draft_number: "Current draft number in the iteration sequence (must be >= 1). Increments with each new critique or revision.",
    
    total_drafts: "Estimated total number of drafts needed to reach a complete API design (must be >= draft_number). Can be adjusted as the design evolves.",
    
    is_critique: "Boolean flag indicating whether the current step is a critique phase (true) evaluating previous API design, or a revision phase (false) implementing improvements.",
    
    critique_focus: "The specific aspect or dimension being critiqued in the current evaluation (e.g., 'naming', 'consistency', 'completeness', 'usability'). Required when is_critique is true.",
    
    revision_instructions: "Detailed, actionable guidance for how to revise the API design based on the preceding critique. Should directly address issues identified in the critique. Required when is_critique is false.",
    
    is_final_draft: "Boolean flag indicating whether this is the final draft in the API design process. Helps signal the completion of the iterative refinement.",
};

export const TOOL_SCHEMA = {
    api_id: z.string()
        .min(1, "API ID cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.api_id),

    name: z.string()
        .min(1, "Name cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.name),

    path: z.string()
        .min(1, "Path cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.path),

    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
        .describe(TOOL_PARAM_DESCRIPTIONS.method),

    description: z.string()
        .min(1, "Description cannot be empty")
        .describe(TOOL_PARAM_DESCRIPTIONS.description),

    request_params: z.array(
        z.object({
            name: z.string().min(1, "Parameter name cannot be empty"),
            type: z.string().min(1, "Parameter type cannot be empty"),
            required: z.boolean(),
            description: z.string()
        })
    ).describe(TOOL_PARAM_DESCRIPTIONS.request_params),

    request_body: z.object({
        content_type: z.string(),
        schema: z.record(z.any()),
        example: z.string()
    }).optional()
        .describe(TOOL_PARAM_DESCRIPTIONS.request_body),

    responses: z.array(
        z.object({
            status_code: z.number().int().min(100).max(599),
            description: z.string().min(1, "Response description cannot be empty"),
            content_type: z.string(),
            schema: z.record(z.any()),
            example: z.string()
        })
    ).min(1, "At least one response is required")
        .describe(TOOL_PARAM_DESCRIPTIONS.responses),

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
    # API Blueprint Designer: Interface Design Through Iterative Refinement

    A tool that facilitates the design, documentation, and refinement of APIs through structured critique and improvement cycles.

    ## When to Use This Tool:
    - **New API Design:** When creating interfaces for new services or components
    - **API Versioning:** Planning and documenting API changes between versions
    - **Contract Negotiation:** Collaborating on interface design between teams
    - **API Standardization:** Ensuring consistency across multiple interfaces
    - **Client Experience Design:** Optimizing APIs for developer experience
    - **Protocol Selection:** Deciding between REST, GraphQL, gRPC, or other approaches

    ## Key Capabilities:
    - **Contract Definition:** Structured specification of endpoints, methods, parameters
    - **Example Generation:** Creates realistic request/response examples
    - **Consistency Analysis:** Ensures naming, parameter, and pattern consistency
    - **Client Usage Simulation:** Demonstrates how clients would use the API
    - **Backward Compatibility Checking:** Identifies breaking changes
    - **Documentation Generation:** Produces comprehensive API documentation
    - **Mock Implementation:** Generates functional mock implementations for testing
    - **Schema Validation:** Ensures data structures are properly defined and validated

    ## Parameters Explained:
    - **api_id:** Unique identifier for the API being designed.
    
    - **name:** Name of the API or endpoint being designed.
    
    - **path:** URL path pattern for the endpoint, including any path parameters in curly braces (e.g., '/users/{id}').
    
    - **method:** HTTP method for the endpoint:
      * "GET": For retrieving resources
      * "POST": For creating resources
      * "PUT": For replacing resources
      * "DELETE": For removing resources
      * "PATCH": For partial updates to resources
    
    - **description:** Detailed description of the endpoint's purpose and behavior.
    
    - **request_params:** Array of request parameters with:
      * name: Parameter name
      * type: Data type (string, number, boolean, etc.)
      * required: Whether the parameter is mandatory
      * description: Explanation of the parameter's purpose
    
    - **request_body:** Schema and example for the request body, if applicable, with:
      * content_type: Media type (e.g., "application/json")
      * schema: Structure definition
      * example: Sample request payload
    
    - **responses:** Array of possible responses with:
      * status_code: HTTP status code
      * description: Explanation of the response condition
      * content_type: Media type of the response
      * schema: Structure definition of the response
      * example: Sample response payload
    
    - **draft_number:** Integer tracking the current iteration (starting from 1). Increments with each critique or revision.
    
    - **total_drafts:** Estimated number of drafts needed for completion. This can be adjusted as the design process evolves.
    
    - **is_critique:** Boolean indicating the current mode:
      * true = Evaluating previous API design
      * false = Implementing revisions
    
    - **critique_focus:** (Required when is_critique=true) Specific aspect being evaluated, such as:
      * "naming": Evaluating the clarity and consistency of resource and parameter names
      * "consistency": Checking for pattern consistency across the API
      * "completeness": Ensuring all necessary information is included
      * "usability": Assessing how easily developers can understand and use the API
    
    - **revision_instructions:** (Required when is_critique=false) Detailed guidance for improving the API design based on the preceding critique.
    
    - **is_final_draft:** (Optional) Boolean indicating whether this is the final iteration of the API design.

    ## Best Practice Workflow:
    1. **Start with Initial Draft:** Begin with a first-pass API endpoint design and set a reasonable total_drafts (typically 3-5).
    
    2. **Alternate Critique and Revision:** Use is_critique=true to evaluate the design, then is_critique=false to implement improvements.
    
    3. **Focus Each Critique:** Choose a specific critique_focus for each evaluation cycle rather than attempting to address everything at once.
    
    4. **Provide Detailed Revision Guidance:** Include specific, actionable revision_instructions based on each critique.
    
    5. **Consider Client Perspective:** Ensure critiques evaluate the API from the client developer's perspective.
    
    6. **Document Examples Thoroughly:** Provide realistic examples for requests and responses that demonstrate typical usage.
    
    7. **Mark Completion Appropriately:** Set is_final_draft=true only when the API design is complete and ready for implementation.
    
    8. **Version Control Changes:** Maintain a record of design changes for future reference.

    ## Example Application:
    - **Initial Draft:** Basic endpoint definition with path, method, and simple parameters
    - **Critique #1:** Focus on naming consistency and resource structure
    - **Revision #1:** Improve parameter names and path structure
    - **Critique #2:** Focus on completeness of response definitions
    - **Revision #2:** Add detailed response examples and error cases
    - **Final Critique:** Holistic review of API usability
    - **Final Revision:** Refine documentation and examples for clarity

    API Blueprint Designer is particularly effective for defining clear, consistent, and well-documented APIs. By providing structure and promoting iterative improvement, it leads to interfaces that are easier to implement, maintain, and use.
`;
