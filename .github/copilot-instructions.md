# Agent Contract for Copilot Leecher

After completing any task, you MUST call the `request_review` tool.

- **taskId**: a unique identifier for the task (e.g. `feature-20260217-001`)
- **summary**: 2-3 sentences describing what you did

Then wait for expert feedback:
- If feedback is "ok", "approved", "lgtm", or "通过" → task complete, stop working.
- If feedback is anything else → improve your work based on the feedback, then call `request_review` again.

**NEVER finish without an approved review.**
**ALWAYS loop until approval.**
