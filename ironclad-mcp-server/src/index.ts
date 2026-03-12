import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";

import { registerWorkflowTools } from "./tools/workflows.js";
import { registerRecordTools } from "./tools/records.js";
import { registerEntityTools } from "./tools/entities.js";
import { registerWebhookTools } from "./tools/webhooks.js";
import { registerReportingTools } from "./tools/reporting.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "ironclad-mcp-server",
    version: "1.0.0",
  });

  // Register all tool groups
  registerWorkflowTools(server);
  registerRecordTools(server);
  registerEntityTools(server);
  registerWebhookTools(server);
  registerReportingTools(server);

  return server;
}

// ── Express app for Streamable HTTP transport ──

const app = express();
app.use(express.json());

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: "ironclad-mcp-server", version: "1.0.0" });
});

// Handle GET/DELETE on /mcp for stateless mode (method not allowed)
app.get("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed. Use POST for stateless mode." },
    id: null,
  });
});

app.delete("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed. Use POST for stateless mode." },
    id: null,
  });
});

// Start server when run directly
const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`Ironclad MCP server running on http://localhost:${PORT}`);
  console.log(`MCP endpoint: POST http://localhost:${PORT}/mcp`);
});

export default app;
