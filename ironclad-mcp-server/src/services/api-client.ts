import axios, { AxiosInstance, AxiosError } from "axios";
import { ENV_VARS, DEFAULT_BASE_URL, API_PREFIX } from "../constants.js";

export class IroncladApiClient {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env[ENV_VARS.IRONCLAD_API_KEY];
    if (!apiKey) {
      throw new Error(
        `Missing ${ENV_VARS.IRONCLAD_API_KEY} environment variable. ` +
          `Set it to your Ironclad API key.`
      );
    }

    const baseUrl =
      process.env[ENV_VARS.IRONCLAD_BASE_URL] || DEFAULT_BASE_URL;

    this.client = axios.create({
      baseURL: `${baseUrl}${API_PREFIX}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

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
        return new Error(
          `Authentication failed (401): ${message}. Check your IRONCLAD_API_KEY.`
        );
      }
      if (status === 403) {
        return new Error(
          `Forbidden (403): ${message}. Your API key may lack the required scope.`
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
