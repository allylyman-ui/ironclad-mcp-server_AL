import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../services/api-client.js";
import { formatJson, successResult, errorResult } from "../services/format.js";

export function registerEntityTools(server: McpServer): void {
  const api = getApiClient();

  // ── List Entities ──
  server.tool(
    "ironclad_list_entities",
    "List entities (counterparties, companies, etc.) with optional filters and pagination.",
    {
      page: z.number().int().min(0).optional().describe("Page number (0-indexed)"),
      pageSize: z.number().int().min(1).max(100).optional().describe("Results per page"),
      filter: z.string().optional().describe("SCIM filter expression"),
    },
    async ({ page, pageSize, filter }) => {
      try {
        const params: Record<string, unknown> = {};
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.pageSize = pageSize;
        if (filter) params.filter = filter;
        const data = await api.get("/entities", params);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get Entity ──
  server.tool(
    "ironclad_get_entity",
    "Get a specific entity by ID.",
    {
      entityId: z.string().describe("The entity ID"),
    },
    async ({ entityId }) => {
      try {
        const data = await api.get(`/entities/${entityId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Create Entity ──
  server.tool(
    "ironclad_create_entity",
    "Create a new entity (counterparty, company, etc.).",
    {
      type: z.string().describe("The entity type"),
      attributes: z.record(z.unknown()).describe("Key-value pairs for entity attributes"),
    },
    async ({ type, attributes }) => {
      try {
        const data = await api.post("/entities", { type, attributes });
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Update Entity ──
  server.tool(
    "ironclad_update_entity",
    "Update attributes on an existing entity.",
    {
      entityId: z.string().describe("The entity ID"),
      attributes: z.record(z.unknown()).describe("Key-value pairs of attributes to update"),
    },
    async ({ entityId, attributes }) => {
      try {
        const data = await api.patch(`/entities/${entityId}`, { attributes });
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Delete Entity ──
  server.tool(
    "ironclad_delete_entity",
    "Permanently delete an entity. This action cannot be undone.",
    {
      entityId: z.string().describe("The entity ID to delete"),
    },
    async ({ entityId }) => {
      try {
        await api.delete(`/entities/${entityId}`);
        return successResult(`Entity ${entityId} deleted successfully.`);
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Relationship Types ──
  server.tool(
    "ironclad_list_relationship_types",
    "List all entity relationship types defined in the system.",
    {},
    async () => {
      try {
        const data = await api.get("/relationship-types");
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );
}
