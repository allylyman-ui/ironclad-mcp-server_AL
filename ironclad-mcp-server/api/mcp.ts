import type { VercelRequest, VercelResponse } from "@vercel/node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { registerWorkflowTools } from "../src/tools/workflows.js";
import { registerRecordTools } from "../src/tools/records.js";
import { registerEntityTools } from "../src/tools/entities.js";
import { registerWebhookTools } from "../src/tools/webhooks.js";
import { registerReportingTools } from "../src/tools/reporting.js";

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

  return server;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST." },
      id: null,
    });
  }

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
