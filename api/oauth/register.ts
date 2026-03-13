import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomId } from "./lib.js";

/**
 * RFC 7591 - Dynamic Client Registration
 * POST /oauth/register
 *
 * Claude sends its client metadata; we return a client_id.
 * Since we use stateless HMAC tokens, we don't need to persist
 * client registrations — the client_id is just a random identifier.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const body = req.body || {};
  const clientId = `client_${randomId(16)}`;

  // Return registration response per RFC 7591
  res.status(201).json({
    client_id: clientId,
    client_name: body.client_name || "Claude MCP Client",
    redirect_uris: body.redirect_uris || [],
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: "mcp:tools",
  });
}
