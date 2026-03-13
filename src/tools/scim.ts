import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../services/api-client.js";
import { formatJson, successResult, errorResult } from "../services/format.js";

export function registerScimTools(server: McpServer): void {
  const api = getApiClient();

  // ═══════════════════════════════════════
  // SCIM Users
  // ═══════════════════════════════════════

  // ── List SCIM Users ──
  server.tool(
    "ironclad_list_scim_users",
    "List all users in the Ironclad environment via SCIM.",
    {
      startIndex: z.number().int().min(1).optional().describe("1-based start index for pagination"),
      count: z.number().int().min(1).max(100).optional().describe("Number of results to return"),
      filter: z.string().optional().describe("SCIM filter expression (e.g. 'userName eq \"user@example.com\"')"),
    },
    async ({ startIndex, count, filter }) => {
      try {
        const params: Record<string, unknown> = {};
        if (startIndex !== undefined) params.startIndex = startIndex;
        if (count !== undefined) params.count = count;
        if (filter) params.filter = filter;
        const data = await api.get("/scim/Users", params);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get SCIM User ──
  server.tool(
    "ironclad_get_scim_user",
    "Get a specific user by their SCIM ID.",
    {
      userId: z.string().describe("The SCIM user ID"),
    },
    async ({ userId }) => {
      try {
        const data = await api.get(`/scim/Users/${userId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Create SCIM User ──
  server.tool(
    "ironclad_create_scim_user",
    "Provision a new user in Ironclad via SCIM.",
    {
      userName: z.string().describe("The user's email address (used as username)"),
      givenName: z.string().describe("First name"),
      familyName: z.string().describe("Last name"),
      active: z.boolean().optional().describe("Whether the user is active (default: true)"),
    },
    async ({ userName, givenName, familyName, active }) => {
      try {
        const body: Record<string, unknown> = {
          schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
          userName,
          name: { givenName, familyName },
        };
        if (active !== undefined) body.active = active;
        const data = await api.post("/scim/Users", body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Update SCIM User ──
  server.tool(
    "ironclad_update_scim_user",
    "Update an existing user's attributes via SCIM.",
    {
      userId: z.string().describe("The SCIM user ID"),
      userName: z.string().optional().describe("Updated email/username"),
      givenName: z.string().optional().describe("Updated first name"),
      familyName: z.string().optional().describe("Updated last name"),
      active: z.boolean().optional().describe("Set user active/inactive"),
    },
    async ({ userId, userName, givenName, familyName, active }) => {
      try {
        const body: Record<string, unknown> = {
          schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
        };
        if (userName) body.userName = userName;
        if (givenName || familyName) {
          const name: Record<string, string> = {};
          if (givenName) name.givenName = givenName;
          if (familyName) name.familyName = familyName;
          body.name = name;
        }
        if (active !== undefined) body.active = active;
        const data = await api.put(`/scim/Users/${userId}`, body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Delete SCIM User ──
  server.tool(
    "ironclad_delete_scim_user",
    "Deprovision/delete a user from Ironclad via SCIM. This action cannot be undone.",
    {
      userId: z.string().describe("The SCIM user ID to delete"),
    },
    async ({ userId }) => {
      try {
        await api.delete(`/scim/Users/${userId}`);
        return successResult(`SCIM user ${userId} deleted successfully.`);
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ═══════════════════════════════════════
  // SCIM Groups
  // ═══════════════════════════════════════

  // ── List SCIM Groups ──
  server.tool(
    "ironclad_list_scim_groups",
    "List all groups in the Ironclad environment via SCIM.",
    {
      startIndex: z.number().int().min(1).optional().describe("1-based start index for pagination"),
      count: z.number().int().min(1).max(100).optional().describe("Number of results to return"),
      filter: z.string().optional().describe("SCIM filter expression"),
    },
    async ({ startIndex, count, filter }) => {
      try {
        const params: Record<string, unknown> = {};
        if (startIndex !== undefined) params.startIndex = startIndex;
        if (count !== undefined) params.count = count;
        if (filter) params.filter = filter;
        const data = await api.get("/scim/Groups", params);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Get SCIM Group ──
  server.tool(
    "ironclad_get_scim_group",
    "Get a specific group by its SCIM ID.",
    {
      groupId: z.string().describe("The SCIM group ID"),
    },
    async ({ groupId }) => {
      try {
        const data = await api.get(`/scim/Groups/${groupId}`);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Create SCIM Group ──
  server.tool(
    "ironclad_create_scim_group",
    "Create a new group in Ironclad via SCIM.",
    {
      displayName: z.string().describe("The group display name"),
      members: z.array(z.object({
        value: z.string().describe("User ID to add as member"),
      })).optional().describe("Initial group members"),
    },
    async ({ displayName, members }) => {
      try {
        const body: Record<string, unknown> = {
          schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
          displayName,
        };
        if (members) body.members = members;
        const data = await api.post("/scim/Groups", body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Update SCIM Group ──
  server.tool(
    "ironclad_update_scim_group",
    "Update a group's display name or members via SCIM.",
    {
      groupId: z.string().describe("The SCIM group ID"),
      displayName: z.string().optional().describe("Updated group name"),
      members: z.array(z.object({
        value: z.string().describe("User ID"),
      })).optional().describe("Updated member list (replaces existing members)"),
    },
    async ({ groupId, displayName, members }) => {
      try {
        const body: Record<string, unknown> = {
          schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
        };
        if (displayName) body.displayName = displayName;
        if (members) body.members = members;
        const data = await api.put(`/scim/Groups/${groupId}`, body);
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ── Delete SCIM Group ──
  server.tool(
    "ironclad_delete_scim_group",
    "Delete a group from Ironclad via SCIM. This action cannot be undone.",
    {
      groupId: z.string().describe("The SCIM group ID to delete"),
    },
    async ({ groupId }) => {
      try {
        await api.delete(`/scim/Groups/${groupId}`);
        return successResult(`SCIM group ${groupId} deleted successfully.`);
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );

  // ═══════════════════════════════════════
  // SCIM Schemas
  // ═══════════════════════════════════════

  // ── List SCIM Schemas ──
  server.tool(
    "ironclad_list_scim_schemas",
    "List all SCIM schemas available in the environment. Shows User and Group schema definitions.",
    {},
    async () => {
      try {
        const data = await api.get("/scim/Schemas");
        return successResult(formatJson(data));
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
  );
}
