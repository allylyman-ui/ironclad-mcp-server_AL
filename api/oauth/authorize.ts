import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createAuthCode } from "./lib.js";

/**
 * OAuth 2.1 Authorization Endpoint with PKCE
 * GET /oauth/authorize
 *
 * Claude redirects the user here. Since this is a machine-to-machine
 * MCP server (no human login required), we auto-approve and redirect
 * back with an authorization code.
 *
 * Query params from Claude:
 *  - response_type=code
 *  - client_id=<from registration>
 *  - redirect_uri=<claude callback>
 *  - code_challenge=<S256 hash>
 *  - code_challenge_method=S256
 *  - scope=mcp:tools
 *  - state=<csrf token>
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const {
    response_type,
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    scope,
    state,
  } = req.query as Record<string, string>;

  // Validate required params
  if (response_type !== "code") {
    return res.status(400).json({ error: "unsupported_response_type" });
  }

  if (!client_id) {
    return res.status(400).json({ error: "invalid_request", error_description: "client_id required" });
  }

  if (!redirect_uri) {
    return res.status(400).json({ error: "invalid_request", error_description: "redirect_uri required" });
  }

  if (!code_challenge || code_challenge_method !== "S256") {
    return res.status(400).json({ error: "invalid_request", error_description: "PKCE S256 required" });
  }

  // Create a signed authorization code containing the PKCE challenge
  const code = createAuthCode({
    clientId: client_id,
    redirectUri: redirect_uri,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method || "S256",
    scope: scope || "mcp:tools",
  });

  // Build redirect URL with code and state
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) {
    redirectUrl.searchParams.set("state", state);
  }

  // Auto-approve: redirect back to Claude with the authorization code
  return res.redirect(302, redirectUrl.toString());
}
