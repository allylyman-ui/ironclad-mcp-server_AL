import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../services/api-client.js";
import { formatJson, successResult, errorResult } from "../services/format.js";

export function registerRecordTools(server: McpServer): void {
  const api = getApiClient();

  // ── List Records ──
  server.tool(
    "ironclad_list_records",
    "List records with optional filters and pagination.",
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
        const data = await api.get("/records", params);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get Record ──
  server.tool(
    "ironclad_get_record",
    "Get a specific record by ID, including all its attributes.",
    {
      recordId: z.string().describe("The record ID"),
    },
    async ({ recordId }) => {
      try {
        const data = await api.get(`/records/${recordId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Create Record ──
  server.tool(
    "ironclad_create_record",
    "Create a new record. Provide the record type and attribute values.",
    {
      type: z.string().describe("The record type/schema ID"),
      attributes: z.record(z.unknown()).describe("Key-value pairs for record attributes"),
    },
    async ({ type, attributes }) => {
      try {
        const data = await api.post("/records", { type, attributes });
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Update Record ──
  server.tool(
    "ironclad_update_record",
    "Update attributes on an existing record.",
    {
      recordId: z.string().describe("The record ID"),
      attributes: z.record(z.unknown()).describe("Key-value pairs of attributes to update"),
    },
    async ({ recordId, attributes }) => {
      try {
        const data = await api.patch(`/records/${recordId}`, { attributes });
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Delete Record ──
  server.tool(
    "ironclad_delete_record",
    "Permanently delete a record. This action cannot be undone.",
    {
      recordId: z.string().describe("The record ID to delete"),
    },
    async ({ recordId }) => {
      try {
        await api.delete(`/records/${recordId}`);
        return successResult(`Record ${recordId} deleted successfully.`);
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Run Record Action ──
  server.tool(
    "ironclad_run_record_action",
    "Run an action (e.g. transition, custom button) on a record.",
    {
      recordId: z.string().describe("The record ID"),
      actionId: z.string().describe("The action ID to execute"),
      parameters: z.record(z.unknown()).optional().describe("Optional parameters for the action"),
    },
    async ({ recordId, actionId, parameters }) => {
      try {
        const body: Record<string, unknown> = { actionId };
        if (parameters) body.parameters = parameters;
        const data = await api.post(`/records/${recordId}/actions`, body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get Record Schema (Metadata) ──
  server.tool(
    "ironclad_get_record_schema",
    "Get the schema/metadata for a record type, including all attribute definitions.",
    {
      recordType: z.string().optional().describe("Record type to get schema for. If omitted, lists all record schemas."),
    },
    async ({ recordType }) => {
      try {
        const path = recordType
          ? `/records/metadata/${recordType}`
          : "/records/metadata";
        const data = await api.get(path);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Smart Import Records ──
  server.tool(
    "ironclad_smart_import_records",
    "Bulk import records using smart import. Provide an array of records to import.",
    {
      recordType: z.string().describe("The record type to import into"),
      records: z.array(z.record(z.unknown())).describe("Array of record attribute objects to import"),
    },
    async ({ recordType, records }) => {
      try {
        const data = await api.post("/records/smart-import", {
          type: recordType,
          records,
        });
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Record Attachments ──
  server.tool(
    "ironclad_list_record_attachments",
    "List all file attachments on a record.",
    {
      recordId: z.string().describe("The record ID"),
    },
    async ({ recordId }) => {
      try {
        const data = await api.get(`/records/${recordId}/attachments`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );
}
