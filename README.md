# copilot-review-hub

**MCP Expert Reviewer for Copilot with Review Center UI**

A Model Context Protocol (MCP) server that lets GitHub Copilot submit code or conversation snippets for human or automated review. Every Copilot conversation can call this MCP to gate-keep changes through a real-time review center.

---

## Features

| Feature | Description |
|---|---|
| 🔌 **MCP Server** | Exposes `submit_review_request`, `get_review_status`, and `wait_for_review` tools for Copilot |
| 🖥️ **Review Center UI** | Dark-mode web dashboard at `http://localhost:3000` for approving / rejecting reviews |
| ⚡ **Real-time updates** | WebSocket push keeps the UI instantly in sync when new reviews arrive |
| 🔔 **Browser Notifications** | Desktop notifications alert reviewers when Copilot submits a new request |
| ✅ **Auto-Approve** | Optional auto-approval with a configurable delay (useful for CI / non-blocking flows) |

---

## Screenshots

**Review Queue**

![Review Queue](https://github.com/user-attachments/assets/c59b54c1-4b40-4184-8520-3b718e76b9a4)

**Settings**

![Settings](https://github.com/user-attachments/assets/12a80837-e542-43b0-92a3-e2cc5edac214)

---

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start (web UI + MCP stdio server together)
npm start
```

The Review Center UI will be available at **http://localhost:3000**.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port for the Review Center UI |
| `REVIEW_HUB_URL` | `http://localhost:3000` | URL shown to Copilot in tool responses |

---

## Connecting to GitHub Copilot

Copy `mcp.config.example.json` to your Copilot MCP configuration (e.g. `.github/copilot/mcp.json`) and update the path:

```json
{
  "mcpServers": {
    "copilot-review-hub": {
      "command": "node",
      "args": ["/absolute/path/to/copilot-review-hub/dist/index.js"],
      "env": {
        "PORT": "3000",
        "REVIEW_HUB_URL": "http://localhost:3000"
      }
    }
  }
}
```

---

## MCP Tools

### `submit_review_request`

Submit content for review. Returns a `review_id`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `content` | string | ✅ | Code or text to review |
| `title` | string | ❌ | Short descriptive title |
| `language` | string | ❌ | Programming language (e.g. `"typescript"`) |

### `get_review_status`

Poll the current status of a review.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `review_id` | string | ✅ | ID returned by `submit_review_request` |

### `wait_for_review`

Block until a review is resolved or the timeout elapses (polls every 2 s).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `review_id` | string | ✅ | ID to wait for |
| `timeout_seconds` | number | ❌ | Max wait time (default: 120) |

---

## Development

```bash
npm test    # Run unit tests
npm run build   # Compile TypeScript
```

---

## Architecture

```
┌─────────────────────────────────────┐
│           Copilot (MCP Client)      │
│  submit_review_request / wait_...   │
└────────────────┬────────────────────┘
                 │ stdio (MCP protocol)
┌────────────────▼────────────────────┐
│         copilot-review-hub          │
│  ┌──────────────┐  ┌─────────────┐  │
│  │  MCP Server  │  │  Web Server │  │
│  │  (stdio)     │  │  :3000      │  │
│  └──────┬───────┘  └──────┬──────┘  │
│         └────────┬─────────┘         │
│              ReviewStore             │
│           (in-memory + events)       │
└──────────────────┬──────────────────┘
                   │ WebSocket
          ┌────────▼────────┐
          │  Review Center  │
          │  (Browser UI)   │
          └─────────────────┘
```
