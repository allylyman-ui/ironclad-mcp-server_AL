import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuthCode, verifyPkce, createAccessToken } from "./lib.js";

/**
 * OAuth 2.1 Token Endpoint
 * POST /oauth/token
 *
 * Exchanges an authorization code + PKCE verifier for an access token.
 * Accepts public clients (no client_secret required).
 *
 * Body params (application/x-www-form-urlencoded or JSON):
 *  - grant_type=authorization_code
 *  - code=<authorization code>
 *  - redirect_uri=<must match>
 *  - client_id=<from registration>
 *  - code_verifier=<PKCE plaintext>
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

  // Parse body — could be JSON or form-urlencoded
  const body = req.body || {};
  const grantType = body.grant_type;
  const code = body.code;
  const redirectUri = body.redirect_uri;
  const clientId = body.client_id;
  const codeVerifier = body.code_verifier;

  if (grantType !== "authorization_code") {
    return res.status(400).json({
      error: "unsupported_grant_type",
      error_description: "Only authorization_code is supported",
    });
  }

  if (!code || !codeVerifier) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "code and code_verifier are required",
    });
  }

  // Verify the authorization code (HMAC-signed, stateless)
  const authCode = verifyAuthCode(code);
  if (!authCode) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "Invalid or expired authorization code",
    });
  }

  // Verify client_id matches
  if (clientId && clientId !== authCode.clientId) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "client_id mismatch",
    });
  }

  // Verify redirect_uri matches
  if (redirectUri && redirectUri !== authCode.redirectUri) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "redirect_uri mismatch",
    });
  }

  // Verify PKCE
  if (!verifyPkce(codeVerifier, authCode.codeChallenge)) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "PKCE verification failed",
    });
  }

  // Issue access token
  const accessToken = createAccessToken(authCode.clientId, authCode.scope);

  res.status(200).json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 86400, // 24 hours
    scope: authCode.scope,
  });
}
