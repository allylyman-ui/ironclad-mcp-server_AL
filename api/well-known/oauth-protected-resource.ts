import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * RFC 9728 - OAuth 2.0 Protected Resource Metadata
 * GET /.well-known/oauth-protected-resource
 *
 * Tells Claude where the authorization server is for this resource.
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
    resource: `${baseUrl}/mcp`,
    authorization_servers: [`${baseUrl}`],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp:tools"],
  });
}

function getBaseUrl(req: VercelRequest): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}`;
}
