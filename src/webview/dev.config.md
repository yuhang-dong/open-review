# Webview Development Configuration

## Overview
This document describes the Vite development server configuration for the VS Code webview panel.

## Configuration Features

### CORS Settings
- Origin: `*` (allows all origins for development)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization
- Credentials: false (for security)

### Hot Module Replacement (HMR)
- HMR Port: 3001
- Client Port: 3001
- Host: localhost
- Automatic reload on file changes

### TypeScript Integration
- Type checking via `npm run type-check:webview`
- Strict TypeScript configuration with enhanced type safety
- Source maps enabled for debugging
- Incremental compilation for faster builds

### Development Scripts
- `npm run dev:webview` - Start Vite development server
- `npm run dev:webview:check` - Start dev server with TypeScript watching
- `npm run type-check:webview` - Run TypeScript type checking only
- `npm run build:webview` - Build for production

### Port Configuration
- Primary Port: 3000 (with fallback to other ports if busy)
- HMR Port: 3001
- Strict Port: false (allows port fallback)

### File System Access
- Allows access to parent directories for VS Code integration
- Non-strict file system access for webview requirements

## Usage

1. Start development server:
   ```bash
   npm run dev:webview
   ```

2. Start with TypeScript watching:
   ```bash
   npm run dev:webview:check
   ```

3. Type check only:
   ```bash
   npm run type-check:webview
   ```

The development server will be available at http://localhost:3000/ with hot reloading enabled.