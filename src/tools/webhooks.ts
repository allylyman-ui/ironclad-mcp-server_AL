import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../services/api-client.js";
import { formatJson, successResult, errorResult } from "../services/format.js";

export function registerWebhookTools(server: McpServer): void {
  const api = getApiClient();

  // ── List Webhooks ──
  server.tool(
    "ironclad_list_webhooks",
    "List all registered webhooks.",
    {},
    async () => {
      try {
        const data = await api.get("/webhooks");
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get Webhook ──
  server.tool(
    "ironclad_get_webhook",
    "Get details for a specific webhook by ID.",
    {
      webhookId: z.string().describe("The webhook ID"),
    },
    async ({ webhookId }) => {
      try {
        const data = await api.get(`/webhooks/${webhookId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Create Webhook ──
  server.tool(
    "ironclad_create_webhook",
    "Register a new webhook to receive event notifications.",
    {
      targetUrl: z.string().url().describe("URL to receive webhook POST requests"),
      events: z.array(z.string()).describe("Array of event types to subscribe to (e.g. 'workflow_launched', 'workflow_signed')"),
    },
    async ({ targetUrl, events }) => {
      try {
        const data = await api.post("/webhooks", { targetUrl, events });
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Update Webhook ──
  server.tool(
    "ironclad_update_webhook",
    "Update an existing webhook's URL or subscribed events.",
    {
      webhookId: z.string().describe("The webhook ID"),
      targetUrl: z.string().url().optional().describe("New target URL"),
      events: z.array(z.string()).optional().describe("New array of event types"),
    },
    async ({ webhookId, targetUrl, events }) => {
      try {
        const body: Record<string, unknown> = {};
        if (targetUrl) body.targetUrl = targetUrl;
        if (events) body.events = events;
        const data = await api.patch(`/webhooks/${webhookId}`, body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Delete Webhook ──
  server.tool(
    "ironclad_delete_webhook",
    "Delete a webhook subscription. This action cannot be undone.",
    {
      webhookId: z.string().describe("The webhook ID to delete"),
    },
    async ({ webhookId }) => {
      try {
        await api.delete(`/webhooks/${webhookId}`);
        return successResult(`Webhook ${webhookId} deleted successfully.`);
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );
}
