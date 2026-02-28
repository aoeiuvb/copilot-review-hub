#!/usr/bin/env node
import { createWebServer } from './web-server.js';
import { startMcpServer } from './mcp-server.js';

const port = parseInt(process.env.PORT ?? '3000', 10);

// Start the web UI server (runs in background alongside MCP stdio)
createWebServer(port);

// Start the MCP stdio server (takes over stdin/stdout)
await startMcpServer();
