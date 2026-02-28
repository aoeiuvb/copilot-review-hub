# Contributing to Copilot Review Hub

Thank you for your interest in contributing to Copilot Review Hub! We welcome contributions from everyone. By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub describing the problem, steps to reproduce it, and the expected behavior.

### Suggesting Enhancements

We love hearing about new ideas! If you have a suggestion for an enhancement, please open an issue and tag it as `enhancement`.

### Pull Requests

1.  **Fork the repository**: Click the "Fork" button on the top right corner of the repository page.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/your-username/copilot-review-hub.git
    cd copilot-review-hub
    ```
3.  **Create a branch**:
    ```bash
    git checkout -b feature/your-feature-name
    ```
4.  **Make changes**: Implement your feature or bug fix.
5.  **Commit changes**:
    ```bash
    git commit -m "feat: add new feature"
    ```
    Please follow [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages.
6.  **Push to your fork**:
    ```bash
    git push origin feature/your-feature-name
    ```
7.  **Create a Pull Request**: Go to the original repository and click "New Pull Request".

## Development Setup

1.  Install dependencies: `npm install`
2.  Run dev server: `npm run dev`
3.  Ensure linting passes: `npm run lint`

### Ports and Servers

- Next.js development server runs on http://localhost:3000 by default.
- The integrated Reviewer Server (Express + Next, started by the MCP process) listens on http://localhost:3456 in production mode.
- To launch the integrated server locally:
  1) Build with `npm run build`
  2) Start with `npm run start`

### Configure MCP for GitHub Copilot (VS Code)

This project provides an MCP stdio server named `copilot-review-hub` and a tool `request_expert_review`.

1. Build the project: `npm run build`
2. Create a `.vscode/mcp.json` in the repository root:

   ```json
   {
     "servers": {
       "copilot-review-hub": {
         "command": "node",
         "args": ["build/index.js"]
       }
     }
   }
   ```

3. Open the file in VS Code and click “Start”, or run “MCP: List Servers” to verify.
4. Open Copilot Chat, switch to Agent mode, and enable tools from `copilot-review-hub`.

## Style Guide

- Use TypeScript for type safety.
- Follow the existing project structure.
- Use Tailwind CSS for styling.
- Keep components small and reusable.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
