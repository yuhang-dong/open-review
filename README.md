# AI × Human Review Comments

A VS Code extension that provides a unified review workflow for managing human-generated comments and AI responses through MCP (Model Context Protocol) integration.

## Features

- Create and manage review comments with draft/published states
- AI integration through MCP server for accessing published comments
- Human-AI validation loops for iterative review processes
- Code anchoring with git diff-style binding
- Centralized Review Panel for comment management

## Development

### Prerequisites

- Node.js (v16 or higher)
- VS Code (v1.74.0 or higher)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile the extension:
   ```bash
   npm run compile
   ```

3. Run the extension in development mode:
   - Press `F5` to open a new Extension Development Host window
   - The extension will be automatically loaded

### Building

To package the extension:
```bash
npm run package
```

## Usage

1. Open a code file in VS Code
2. Select code or position cursor on a line
3. Right-click and select "Add Comment" or use Command Palette
4. Manage comments in the Review Panel sidebar

## License

MIT