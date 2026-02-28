import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { store } from './store.js';
import type { ReviewRequest } from './types.js';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'copilot-review-hub',
    version: '1.0.0',
  });

  // Tool: submit_review_request
  server.tool(
    'submit_review_request',
    'Submit a piece of code or text for human or automated review. Returns a review_id that can be used to poll for the result.',
    {
      content: z.string().describe('The code or text content to be reviewed.'),
      title: z
        .string()
        .optional()
        .describe('Short title describing what is being reviewed.'),
      language: z
        .string()
        .optional()
        .describe('Programming language of the content (e.g. "python", "typescript").'),
    },
    async ({ content, title, language }) => {
      const settings = store.getSettings();
      const id = uuidv4();
      const now = new Date().toISOString();
      const review: ReviewRequest = {
        id,
        title: title ?? 'Untitled Review',
        content,
        language,
        status: 'pending',
        createdAt: now,
      };

      store.addReview(review);

      // Handle auto-approve
      if (settings.autoApprove) {
        const delay = settings.autoApproveDelay * 1000;
        setTimeout(() => {
          store.updateStatus(id, 'auto_approved', 'Auto-approved by system settings.');
        }, delay);
      }

      const webUiUrl = process.env.REVIEW_HUB_URL ?? 'http://localhost:3000';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              review_id: id,
              status: 'pending',
              message: `Review submitted successfully. ${
                settings.autoApprove
                  ? `Will be auto-approved in ${settings.autoApproveDelay}s.`
                  : `Awaiting manual review at ${webUiUrl}`
              }`,
              ui_url: webUiUrl,
            }),
          },
        ],
      };
    }
  );

  // Tool: get_review_status
  server.tool(
    'get_review_status',
    'Get the current status and result of a previously submitted review request.',
    {
      review_id: z.string().describe('The review ID returned by submit_review_request.'),
    },
    async ({ review_id }) => {
      const review = store.getReview(review_id);
      if (!review) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Review '${review_id}' not found.` }),
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              review_id: review.id,
              title: review.title,
              status: review.status,
              comments: review.comments ?? null,
              created_at: review.createdAt,
              resolved_at: review.resolvedAt ?? null,
            }),
          },
        ],
      };
    }
  );

  // Tool: wait_for_review
  server.tool(
    'wait_for_review',
    'Wait until a review is resolved (approved or rejected) or the timeout elapses. Polls every 2 seconds.',
    {
      review_id: z.string().describe('The review ID to wait for.'),
      timeout_seconds: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Maximum seconds to wait before returning. Defaults to 120.'),
    },
    async ({ review_id, timeout_seconds = 120 }) => {
      const deadline = Date.now() + timeout_seconds * 1000;
      const POLL_INTERVAL = 2000;

      while (Date.now() < deadline) {
        const review = store.getReview(review_id);
        if (!review) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: `Review '${review_id}' not found.` }),
              },
            ],
            isError: true,
          };
        }

        if (review.status !== 'pending') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  review_id: review.id,
                  status: review.status,
                  comments: review.comments ?? null,
                  resolved_at: review.resolvedAt ?? null,
                }),
              },
            ],
          };
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              review_id,
              status: 'pending',
              message: `Timed out after ${timeout_seconds}s. Review is still pending.`,
            }),
          },
        ],
      };
    }
  );

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
