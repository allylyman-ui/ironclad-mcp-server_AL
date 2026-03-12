// Ironclad MCP Server Constants

export const CHARACTER_LIMIT = 25000;

export const ENV_VARS = {
  IRONCLAD_CLIENT_ID: "IRONCLAD_CLIENT_ID",
  IRONCLAD_CLIENT_SECRET: "IRONCLAD_CLIENT_SECRET",
  IRONCLAD_BASE_URL: "IRONCLAD_BASE_URL",
} as const;

export const DEFAULT_BASE_URL = "https://demo.ironcladapp.com";
export const API_PREFIX = "/public/api/v1";
export const TOKEN_PATH = "/oauth/token";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Refresh token 5 minutes before expiry to avoid mid-request failures
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
