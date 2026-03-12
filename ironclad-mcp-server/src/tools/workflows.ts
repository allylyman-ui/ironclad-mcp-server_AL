import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../services/api-client.js";
import { formatJson, successResult, errorResult } from "../services/format.js";

export function registerWorkflowTools(server: McpServer): void {
  const api = getApiClient();

  // ── List Workflows ──
  server.tool(
    "ironclad_list_workflows",
    "List workflows with optional filters. Returns paginated results.",
    {
      page: z.number().int().min(0).optional().describe("Page number (0-indexed)"),
      pageSize: z.number().int().min(1).max(100).optional().describe("Results per page (default 20, max 100)"),
      filter: z.string().optional().describe("SCIM filter expression, e.g. 'status eq \"signed\"'"),
    },
    async ({ page, pageSize, filter }) => {
      try {
        const params: Record<string, unknown> = {};
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.pageSize = pageSize;
        if (filter) params.filter = filter;
        const data = await api.get("/workflows", params);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get Workflow ──
  server.tool(
    "ironclad_get_workflow",
    "Get details for a specific workflow by its ID.",
    {
      workflowId: z.string().describe("The workflow ID"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.get(`/workflows/${workflowId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Create Workflow ──
  server.tool(
    "ironclad_create_workflow",
    "Launch a new workflow from a workflow schema. Provide the template ID and any attribute values.",
    {
      templateId: z.string().describe("The workflow schema/template ID to launch"),
      attributes: z.record(z.unknown()).optional().describe("Key-value pairs for workflow attributes"),
      creator: z.string().optional().describe("Email or user ID of the creator"),
    },
    async ({ templateId, attributes, creator }) => {
      try {
        const body: Record<string, unknown> = { templateId };
        if (attributes) body.attributes = attributes;
        if (creator) body.creator = creator;
        const data = await api.post("/workflows", body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Update Workflow Attributes ──
  server.tool(
    "ironclad_update_workflow_attributes",
    "Update attribute values on an existing workflow.",
    {
      workflowId: z.string().describe("The workflow ID"),
      attributes: z.record(z.unknown()).describe("Key-value pairs of attributes to update"),
    },
    async ({ workflowId, attributes }) => {
      try {
        const data = await api.patch(`/workflows/${workflowId}/attributes`, attributes);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Workflow Approvals ──
  server.tool(
    "ironclad_list_workflow_approvals",
    "List all approvals for a specific workflow.",
    {
      workflowId: z.string().describe("The workflow ID"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.get(`/workflows/${workflowId}/approvals`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Update Workflow Approval ──
  server.tool(
    "ironclad_update_workflow_approval",
    "Approve or reject a workflow approval. Set status to 'approved' or 'rejected'.",
    {
      workflowId: z.string().describe("The workflow ID"),
      approvalId: z.string().describe("The approval ID"),
      status: z.enum(["approved", "rejected"]).describe("New approval status"),
      comment: z.string().optional().describe("Optional comment with the approval decision"),
    },
    async ({ workflowId, approvalId, status, comment }) => {
      try {
        const body: Record<string, unknown> = { status };
        if (comment) body.comment = comment;
        const data = await api.patch(
          `/workflows/${workflowId}/approvals/${approvalId}`,
          body
        );
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Workflow Comments ──
  server.tool(
    "ironclad_list_workflow_comments",
    "List all comments on a specific workflow.",
    {
      workflowId: z.string().describe("The workflow ID"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.get(`/workflows/${workflowId}/comments`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Create Workflow Comment ──
  server.tool(
    "ironclad_create_workflow_comment",
    "Add a comment to a workflow.",
    {
      workflowId: z.string().describe("The workflow ID"),
      body: z.string().describe("The comment text"),
    },
    async ({ workflowId, body: commentBody }) => {
      try {
        const data = await api.post(`/workflows/${workflowId}/comments`, {
          body: commentBody,
        });
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Workflow Documents ──
  server.tool(
    "ironclad_list_workflow_documents",
    "List all documents attached to a workflow.",
    {
      workflowId: z.string().describe("The workflow ID"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.get(`/workflows/${workflowId}/documents`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Upload Workflow Document ──
  server.tool(
    "ironclad_create_workflow_document",
    "Upload/attach a document to a workflow. Provide a download URL for the document.",
    {
      workflowId: z.string().describe("The workflow ID"),
      name: z.string().describe("Document file name"),
      downloadUrl: z.string().url().describe("URL to download the document from"),
    },
    async ({ workflowId, name, downloadUrl }) => {
      try {
        const data = await api.post(`/workflows/${workflowId}/documents`, {
          name,
          downloadUrl,
        });
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Workflow Signatures ──
  server.tool(
    "ironclad_list_workflow_signatures",
    "List all signature packets for a workflow.",
    {
      workflowId: z.string().describe("The workflow ID"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.get(`/workflows/${workflowId}/signatures`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Workflow Participants ──
  server.tool(
    "ironclad_list_workflow_participants",
    "List all participants (reviewers, approvers, signers) on a workflow.",
    {
      workflowId: z.string().describe("The workflow ID"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.get(`/workflows/${workflowId}/participants`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Cancel Workflow ──
  server.tool(
    "ironclad_cancel_workflow",
    "Cancel an active workflow. This is a destructive action.",
    {
      workflowId: z.string().describe("The workflow ID to cancel"),
      reason: z.string().optional().describe("Reason for cancellation"),
    },
    async ({ workflowId, reason }) => {
      try {
        const body: Record<string, unknown> = {};
        if (reason) body.reason = reason;
        const data = await api.post(`/workflows/${workflowId}/cancel`, body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Pause Workflow ──
  server.tool(
    "ironclad_pause_workflow",
    "Pause an active workflow.",
    {
      workflowId: z.string().describe("The workflow ID to pause"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.post(`/workflows/${workflowId}/pause`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Resume Workflow ──
  server.tool(
    "ironclad_resume_workflow",
    "Resume a paused workflow.",
    {
      workflowId: z.string().describe("The workflow ID to resume"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.post(`/workflows/${workflowId}/resume`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Revert Workflow to Review ──
  server.tool(
    "ironclad_revert_workflow_to_review",
    "Revert a workflow back to the review step.",
    {
      workflowId: z.string().describe("The workflow ID"),
    },
    async ({ workflowId }) => {
      try {
        const data = await api.post(`/workflows/${workflowId}/revert-to-review`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Workflow Schemas ──
  server.tool(
    "ironclad_list_workflow_schemas",
    "List all available workflow schemas (templates) in the environment.",
    {},
    async () => {
      try {
        const data = await api.get("/workflow-schemas");
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get Workflow Schema ──
  server.tool(
    "ironclad_get_workflow_schema",
    "Get details for a specific workflow schema including its attribute definitions.",
    {
      schemaId: z.string().describe("The workflow schema ID"),
    },
    async ({ schemaId }) => {
      try {
        const data = await api.get(`/workflow-schemas/${schemaId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── List Approval Requests ──
  server.tool(
    "ironclad_list_approval_requests",
    "List pending approval requests across all workflows.",
    {
      page: z.number().int().min(0).optional().describe("Page number (0-indexed)"),
      pageSize: z.number().int().min(1).max(100).optional().describe("Results per page"),
    },
    async ({ page, pageSize }) => {
      try {
        const params: Record<string, unknown> = {};
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.pageSize = pageSize;
        const data = await api.get("/approval-requests", params);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );
}
