import type { GitForgeConfig } from "./interface";

interface ForgejoApiResponse {
  ok: boolean;
  status: number;
  data: any;
}

export class ForgejoApiClient {
  private config: GitForgeConfig;
  private headers: Record<string, string>;

  constructor(config: GitForgeConfig) {
    this.config = config;
    this.headers = {
      Authorization: `token ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private getApiUrl(path: string): string {
    if (!this.config.apiUrl) {
      throw new Error("apiUrl is required for Forgejo provider");
    }
    return `${this.config.apiUrl}${path}`;
  }

  async get(path: string): Promise<ForgejoApiResponse> {
    try {
      const response = await fetch(this.getApiUrl(path), {
        method: "GET",
        headers: this.headers,
      });

      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      throw new Error(`Forgejo API GET request failed: ${error}`);
    }
  }

  async post(path: string, body: any): Promise<ForgejoApiResponse> {
    try {
      const response = await fetch(this.getApiUrl(path), {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      throw new Error(`Forgejo API POST request failed: ${error}`);
    }
  }

  async patch(path: string, body: any): Promise<ForgejoApiResponse> {
    try {
      const response = await fetch(this.getApiUrl(path), {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      throw new Error(`Forgejo API PATCH request failed: ${error}`);
    }
  }
}
