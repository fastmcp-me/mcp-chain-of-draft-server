# MCP Chain of Draft Server 🧠

[Banner Image Placeholder - We can add a cool banner showing iterative refinement process]

Chain of Draft Server is a powerful AI-driven tool that helps developers make better decisions through systematic, iterative refinement of thoughts and designs. It integrates seamlessly with popular AI agents and provides a structured approach to reasoning, API design, architecture decisions, code reviews, and implementation planning.

## 🌟 Features

### Core Capabilities

* **Iterative Reasoning**: Systematic improvement through the Chain of Draft protocol
* **Thought History**: Track and manage reasoning iterations
* **Branching Support**: Focus reviews on specific reasoning steps
* **TypeScript Support**: Full TypeScript implementation with Zod validation
* **Error Handling**: Comprehensive error types and handling
* **Real-time Logging**: Built-in debugging and monitoring system

### Specialized Tools

* **API Blueprint Designer** 🔨  
  * Design APIs through iterative refinement  
  * Document endpoints systematically  
  * Validate API structures in real-time
* **Architecture Decision Recorder** 📝  
  * Document decisions systematically  
  * Track alternatives and consequences  
  * Maintain decision history
* **Code Review Lens** 🔍  
  * Multi-dimensional code analysis  
  * Focused critique capabilities  
  * Structured review process
* **Implementation Strategy Planner** 📊  
  * Break down complex features  
  * Plan implementation approaches  
  * Track dependencies and constraints

## 🎯 How It Works

1. **Choose Your Tool**
   * Select the appropriate specialized tool for your task
   * Each tool follows the Chain of Draft protocol
   * Start with an initial draft of your thoughts

2. **Iterative Refinement**
   * Tools guide you through systematic critique
   * Receive focused improvement suggestions
   * Refine your work through multiple drafts

3. **Final Output**
   * Get polished, well-documented results
   * Track the evolution of your thinking
   * Maintain history for future reference

## 🚀 Getting Started

### Prerequisites

* Node.js >= 16.0.0
* npm >= 8.0.0

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mcp-chain-of-draft-server.git
cd mcp-chain-of-draft-server
```

2. Install dependencies:

```bash
npm install
```

### Configuration

Simple server configuration in `initialize.ts`:

```typescript
const serverConfig = {
    name: "chain-of-draft",
    version: "1.0.0",
}
```

## 💡 Usage Examples

### Chain of Draft Protocol

```typescript
const thoughtData = {
    reasoning_chain: ["Initial analysis of the problem"],
    next_step_needed: true,
    draft_number: 1,
    total_drafts: 3,
    is_critique: true,
    critique_focus: "logical_consistency"
};
```

### API Blueprint Designer

```typescript
const apiDesign = {
    api_id: "user-service",
    name: "Create User",
    path: "/users",
    method: "POST",
    description: "Create a new user account",
    // ... other parameters
};
```

### Architecture Decision Recorder

```typescript
const adr = {
    id: "auth-001",
    title: "Authentication Strategy",
    status: "proposed",
    context: "Need to implement user authentication",
    // ... other parameters
};
```

## 🛠️ Development

### Project Structure

```
src/
├── tools/                          # Specialized Tools
│   ├── chainOfDraft/              # Core Protocol
│   ├── apiBluprintDesigner/       # API Design Tool
│   ├── architectureDecisionRecorder/ # ADR Tool
│   ├── codeReviewLens/            # Code Review Tool
│   └── implementationStrategyPlanner/ # Planning Tool
├── utils/                         # Utilities
└── index.ts                      # Entry Point
```

### Starting Development Server

```bash
npm run dev
```

## ❓ FAQ

### How does the Chain of Draft protocol work?

The protocol guides you through systematic improvement of your thinking through iterative drafts and focused critiques.

### Can I customize the critique dimensions?

Yes! Each tool supports custom critique focuses tailored to your specific needs.

### How many drafts should I plan for?

We recommend 3-5 drafts for most tasks, but you can adjust based on complexity.

## 🤝 Contributing

We welcome contributions! Please check our [Contributing Guidelines](CONTRIBUTING.md).

## 👥 Community & Support

* GitHub Issues - Report bugs or suggest features
* Pull Requests - Submit your contributions
* Documentation - Check our detailed docs

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

* Thanks to our contributors and early adopters
* Special thanks to the MCP community
* Inspired by systematic reasoning methodologies

---

Made with 🧠 by @bsmi021
