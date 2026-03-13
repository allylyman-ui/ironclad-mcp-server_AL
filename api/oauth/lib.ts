import { createHmac, createHash, randomBytes } from "crypto";

/**
 * Shared OAuth library for stateless Vercel functions.
 *
 * Uses HMAC-signed tokens so any serverless instance can verify them
 * without shared state (no database needed).
 * The signing secret is from OAUTH_SECRET env var (or falls back
 * to IRONCLAD_CLIENT_SECRET for convenience).
 */

function getSecret(): string {
  return process.env.OAUTH_SECRET || process.env.IRONCLAD_CLIENT_SECRET || "default-dev-secret";
}

/** Sign a payload into a stateless token: base64url(payload).base64url(hmac) */
export function signToken(payload: Record<string, unknown>): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** Verify and decode a signed token. Returns null if invalid. */
export function verifyToken(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = createHmac("sha256", getSecret()).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

/** Generate a cryptographically random string */
export function randomId(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Sign an authorization code that embeds the PKCE challenge and client info */
export function createAuthCode(params: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
}): string {
  return signToken({
    type: "auth_code",
    ...params,
    iat: Date.now(),
    exp: Date.now() + 10 * 60 * 1000, // 10 minute expiry
  });
}

/** Verify an authorization code and return its contents */
export function verifyAuthCode(code: string): {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
} | null {
  const payload = verifyToken(code);
  if (!payload) return null;
  if (payload.type !== "auth_code") return null;
  if (typeof payload.exp === "number" && Date.now() > payload.exp) return null;
  return {
    clientId: payload.clientId as string,
    redirectUri: payload.redirectUri as string,
    codeChallenge: payload.codeChallenge as string,
    codeChallengeMethod: payload.codeChallengeMethod as string,
    scope: payload.scope as string,
  };
}

/** Create an access token */
export function createAccessToken(clientId: string, scope: string): string {
  return signToken({
    type: "access_token",
    clientId,
    scope,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hour expiry
  });
}

/** Verify an access token */
export function verifyAccessToken(token: string): { clientId: string; scope: string } | null {
  const payload = verifyToken(token);
  if (!payload) return null;
  if (payload.type !== "access_token") return null;
  if (typeof payload.exp === "number" && Date.now() > payload.exp) return null;
  return { clientId: payload.clientId as string, scope: payload.scope as string };
}

/**
 * Verify PKCE S256: SHA-256(code_verifier) should equal code_challenge
 * Both use base64url encoding per RFC 7636.
 */
export function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash("sha256").update(codeVerifier).digest("base64url");
  return computed === codeChallenge;
}
