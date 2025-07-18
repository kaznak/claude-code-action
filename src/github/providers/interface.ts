import type { FetchDataResult, FetchDataParams } from "./types";

/**
 * Abstract interface for Git forge providers (GitHub, Forgejo, etc.)
 */
export interface GitForgeProvider {
  /**
   * Fetch comprehensive data for a pull request or issue
   */
  fetchData(params: FetchDataParams): Promise<FetchDataResult>;

  /**
   * Fetch user display name by login
   */
  fetchUserDisplayName(login: string): Promise<string | null>;

  /**
   * Create a comment on a pull request or issue
   */
  createComment(repository: string, number: string, body: string): Promise<void>;

  /**
   * Update an existing comment
   */
  updateComment(repository: string, commentId: string, body: string): Promise<void>;

  /**
   * Get the provider type identifier
   */
  getProviderType(): string;
}

/**
 * Configuration for Git forge providers
 */
export interface GitForgeConfig {
  /** API base URL (e.g., "https://api.github.com" or "https://forgejo.example.com/api/v1") */
  apiUrl: string;
  /** Server base URL (e.g., "https://github.com" or "https://forgejo.example.com") */
  serverUrl: string;
  /** Authentication token */
  token: string;
  /** Provider type */
  type: 'github' | 'forgejo';
}