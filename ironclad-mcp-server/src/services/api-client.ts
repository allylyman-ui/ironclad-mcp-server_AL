import axios, { AxiosInstance, AxiosError } from "axios";
import {
  ENV_VARS,
  DEFAULT_BASE_URL,
  API_PREFIX,
  TOKEN_PATH,
  TOKEN_REFRESH_BUFFER_MS,
} from "../constants.js";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
}

export class IroncladApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  // Token cache
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0; // epoch ms

  constructor() {
    this.clientId = process.env[ENV_VARS.IRONCLAD_CLIENT_ID] || "";
    this.clientSecret = process.env[ENV_VARS.IRONCLAD_CLIENT_SECRET] || "";

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        `Missing OAuth credentials. Set ${ENV_VARS.IRONCLAD_CLIENT_ID} and ` +
          `${ENV_VARS.IRONCLAD_CLIENT_SECRET} environment variables.`
      );
    }

    this.baseUrl = process.env[ENV_VARS.IRONCLAD_BASE_URL] || DEFAULT_BASE_URL;

    this.client = axios.create({
      baseURL: `${this.baseUrl}${API_PREFIX}`,
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    // Inject a fresh Bearer token before every request
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  // ── OAuth Client Credentials token exchange ──

  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    return this.refreshToken();
  }

  private async refreshToken(): Promise<string> {
    try {
      const response = await axios.post<TokenResponse>(
        `${this.baseUrl}${TOKEN_PATH}`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000,
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt =
        Date.now() + response.data.expires_in * 1000 - TOKEN_REFRESH_BUFFER_MS;

      return this.accessToken;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const data = error.response?.data;
        const msg =
          typeof data === "object" && data !== null && "error_description" in data
            ? (data as { error_description: string }).error_description
            : error.message;
        throw new Error(
          `OAuth token exchange failed (${status}): ${msg}. ` +
            `Verify IRONCLAD_CLIENT_ID and IRONCLAD_CLIENT_SECRET.`
        );
      }
      throw error;
    }
  }

  // ── HTTP methods ──

  async get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<T>(path, { params });
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async post<T = unknown>(path: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.post<T>(path, data);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async patch<T = unknown>(path: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.patch<T>(path, data);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async put<T = unknown>(path: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.put<T>(path, data);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async delete<T = unknown>(path: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(path);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  private formatError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data;
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message: string }).message
          : error.message;

      if (status === 401) {
        // Token may have been revoked — clear cache so next call re-authenticates
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        return new Error(
          `Authentication failed (401): ${message}. Token has been cleared and will refresh on next call.`
        );
      }
      if (status === 403) {
        return new Error(
          `Forbidden (403): ${message}. Your OAuth client may lack the required scope.`
        );
      }
      if (status === 404) {
        return new Error(
          `Not found (404): ${message}. Verify the resource ID exists.`
        );
      }
      if (status === 429) {
        return new Error(
          `Rate limited (429): ${message}. Wait a moment and retry.`
        );
      }
      return new Error(`Ironclad API error (${status}): ${message}`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}

let clientInstance: IroncladApiClient | null = null;

export function getApiClient(): IroncladApiClient {
  if (!clientInstance) {
    clientInstance = new IroncladApiClient();
  }
  return clientInstance;
}
