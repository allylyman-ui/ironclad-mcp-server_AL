import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * RFC 8414 - OAuth 2.0 Authorization Server Metadata
 * GET /.well-known/oauth-authorization-server
 *
 * Describes the OAuth endpoints and capabilities of this server.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const baseUrl = getBaseUrl(req);

  res.status(200).json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    scopes_supported: ["mcp:tools"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
  });
}

function getBaseUrl(req: VercelRequest): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}`;
}
