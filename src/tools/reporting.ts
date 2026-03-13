import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../services/api-client.js";
import { formatJson, successResult, errorResult } from "../services/format.js";

export function registerReportingTools(server: McpServer): void {
  const api = getApiClient();

  // ── Create Report ──
  server.tool(
    "ironclad_create_report",
    "Create/run a report. Specify the report type, filters, and fields to include.",
    {
      type: z.string().describe("Report type (e.g. 'workflows', 'records')"),
      filters: z.record(z.unknown()).optional().describe("Filter criteria for the report"),
      fields: z.array(z.string()).optional().describe("Specific fields to include in the report"),
      format: z.enum(["json", "csv"]).optional().describe("Output format (default: json)"),
    },
    async ({ type, filters, fields, format }) => {
      try {
        const body: Record<string, unknown> = { type };
        if (filters) body.filters = filters;
        if (fields) body.fields = fields;
        if (format) body.format = format;
        const data = await api.post("/reports", body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List / Read Reports ──
  server.tool(
    "ironclad_list_reports",
    "List previously generated reports.",
    {
      page: z.number().int().min(0).optional().describe("Page number (0-indexed)"),
      pageSize: z.number().int().min(1).max(100).optional().describe("Results per page"),
    },
    async ({ page, pageSize }) => {
      try {
        const params: Record<string, unknown> = {};
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.pageSize = pageSize;
        const data = await api.get("/reports", params);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get Report ──
  server.tool(
    "ironclad_get_report",
    "Get a specific report by ID, including its results or download URL.",
    {
      reportId: z.string().describe("The report ID"),
    },
    async ({ reportId }) => {
      try {
        const data = await api.get(`/reports/${reportId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Obligations ──
  server.tool(
    "ironclad_list_obligations",
    "List contract obligations with optional filters.",
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
        const data = await api.get("/obligations", params);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get Obligation ──
  server.tool(
    "ironclad_get_obligation",
    "Get a specific obligation by ID.",
    {
      obligationId: z.string().describe("The obligation ID"),
    },
    async ({ obligationId }) => {
      try {
        const data = await api.get(`/obligations/${obligationId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Create Obligation ──
  server.tool(
    "ironclad_create_obligation",
    "Create a new contract obligation.",
    {
      attributes: z.record(z.unknown()).describe("Key-value pairs for obligation attributes"),
    },
    async ({ attributes }) => {
      try {
        const data = await api.post("/obligations", attributes);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Update Obligation ──
  server.tool(
    "ironclad_update_obligation",
    "Update an existing contract obligation.",
    {
      obligationId: z.string().describe("The obligation ID"),
      attributes: z.record(z.unknown()).describe("Key-value pairs of attributes to update"),
    },
    async ({ obligationId, attributes }) => {
      try {
        const data = await api.patch(`/obligations/${obligationId}`, attributes);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Delete Obligation ──
  server.tool(
    "ironclad_delete_obligation",
    "Permanently delete a contract obligation. This action cannot be undone.",
    {
      obligationId: z.string().describe("The obligation ID to delete"),
    },
    async ({ obligationId }) => {
      try {
        await api.delete(`/obligations/${obligationId}`);
        return successResult(`Obligation ${obligationId} deleted successfully.`);
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );
}
