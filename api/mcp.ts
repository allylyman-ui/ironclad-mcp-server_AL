import type { VercelRequest, VercelResponse } from "@vercel/node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { registerWorkflowTools } from "../src/tools/workflows.js";
import { registerRecordTools } from "../src/tools/records.js";
import { registerEntityTools } from "../src/tools/entities.js";
import { registerWebhookTools } from "../src/tools/webhooks.js";
import { registerReportingTools } from "../src/tools/reporting.js";
import { registerScimTools } from "../src/tools/scim.js";
import { verifyAccessToken } from "./oauth/lib.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "ironclad-mcp-server",
    version: "1.0.0",
  });

  registerWorkflowTools(server);
  registerRecordTools(server);
  registerEntityTools(server);
  registerWebhookTools(server);
  registerReportingTools(server);
  registerScimTools(server);

  return server;
}

function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, Mcp-Session-Id"
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

function getBaseUrl(req: VercelRequest): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET requests - return 405 for stateless mode
  if (req.method === "GET") {
    return res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "Method not allowed. This server operates in stateless mode - use POST.",
      },
      id: null,
    });
  }

  // DELETE requests - return 405 for stateless mode
  if (req.method === "DELETE") {
    return res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed. This server operates in stateless mode.",
      },
      id: null,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST." },
      id: null,
    });
  }

  // ── Bearer token authentication ──
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const baseUrl = getBaseUrl(req);
    res.setHeader(
      "WWW-Authenticate",
      `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`
    );
    return res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Authentication required" },
      id: null,
    });
  }

  const token = authHeader.slice(7);
  const tokenData = verifyAccessToken(token);
  if (!tokenData) {
    return res.status(403).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Invalid or expired access token" },
      id: null,
    });
  }

  // ── Token valid — process MCP request ──
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}
