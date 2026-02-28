#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { sharedState } from "./shared-state.js";
import { startReviewerServer } from "./reviewer-server.js";

// Start the Express server for the Expert Review Dashboard
startReviewerServer();

const server = new Server(
  {
    name: "copilot-review-hub",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "request_expert_review",
        description: "Submit a task or code for expert human review. The agent MUST use this tool when a critical milestone is reached or before finalizing a task. The agent will wait for the expert's feedback.",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Unique identifier for the overall task/requirement (e.g. 'TASK-123' or 'auth-module'). Keep this consistent across related reviews.",
            },
            taskTitle: {
              type: "string",
              description: "High-level title for the entire task group (e.g. 'User Authentication Implementation'). This will be used to group related reviews in the dashboard.",
            },
            title: {
              type: "string",
              description: "Specific title for this review iteration (e.g. 'Login API Logic' or 'Fixing Validation Bug').",
            },
            summary: {
              type: "string",
              description: "Brief summary of changes or questions.",
            },
            details: {
              type: "string",
              description: "Detailed description, code snippets, or specific questions for the reviewer. Supports Markdown.",
            },
          },
          required: ["taskId", "title", "summary", "details"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "request_expert_review") {
    const { taskId, taskTitle, title, summary, details } = request.params.arguments as any;
    
    // Create a new review session
    const session = sharedState.createSession(taskId, taskTitle, title, summary, details);
    
    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_WAIT = 86400000; // 24 hours timeout
    
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkStatus = () => {
        const currentSession = sharedState.getSession(session.sessionId);
        
        if (currentSession && currentSession.status !== 'pending') {
          // Review complete
          if (currentSession.status === 'approved') {
            resolve({
              content: [
                {
                  type: "text",
                  text: `Review Approved!\n\nFeedback: ${currentSession.feedback || 'Proceed.'}`,
                },
              ],
            });
          } else {
            resolve({
              content: [
                {
                  type: "text",
                  text: `Review Returned (Changes Requested).\n\nFeedback: ${currentSession.feedback}\n\nPlease address the feedback and submit a new review request.`,
                },
              ],
              isError: true, // Mark as error to force the agent to stop and fix
            });
          }
        } else {
          // Still pending
          if (Date.now() - startTime > MAX_WAIT) {
             resolve({
              content: [
                {
                  type: "text",
                  text: `Review timed out. Please check the dashboard manually or try again later. Session ID: ${session.sessionId}`,
                },
              ],
              isError: true,
            });
          } else {
            setTimeout(checkStatus, POLL_INTERVAL);
          }
        }
      };
      
      checkStatus();
    });
  }

  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
