import type { GitForgeProvider, GitForgeConfig } from "./interface";
import type { FetchDataResult, FetchDataParams } from "./types";
import { ForgejoApiClient } from "./forgejo-client";

/**
 * Forgejo provider implementation using REST API
 * This is a skeleton implementation that will be completed in Phase 2
 */
export class ForgejoProvider implements GitForgeProvider {
  private client: ForgejoApiClient;

  constructor(config: GitForgeConfig) {
    this.client = new ForgejoApiClient(config);
  }

  getProviderType(): string {
    return "forgejo";
  }

  async fetchData(_params: FetchDataParams): Promise<FetchDataResult> {
    // TODO: Implement Forgejo REST API calls in Phase 2
    // This will replace GraphQL queries with REST API calls to Forgejo

    // Placeholder implementation - will be replaced with actual REST API calls
    throw new Error("Forgejo provider not yet implemented. Coming in Phase 2.");
  }

  async fetchUserDisplayName(login: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/users/${login}`);
      if (response.ok && response.data) {
        return response.data.full_name || response.data.login || null;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch user display name for ${login}:`, error);
      return null;
    }
  }

  async createComment(
    repository: string,
    number: string,
    body: string,
  ): Promise<void> {
    try {
      const parts = repository.split("/");
      if (parts.length !== 2) {
        throw new Error(`Invalid repository format: ${repository}`);
      }
      const [owner, repo] = parts;
      
      const response = await this.client.post(
        `/repos/${owner}/${repo}/issues/${number}/comments`,
        { body },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create comment on ${repository}#${number}: ${response.status} ${response.data?.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error(
        `Failed to create comment for ${repository}#${number}:`,
        error,
      );
      throw error;
    }
  }

  async updateComment(
    repository: string,
    commentId: string,
    body: string,
  ): Promise<void> {
    try {
      const parts = repository.split("/");
      if (parts.length !== 2) {
        throw new Error(`Invalid repository format: ${repository}`);
      }
      const [owner, repo] = parts;
      
      const response = await this.client.patch(
        `/repos/${owner}/${repo}/issues/comments/${commentId}`,
        { body },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update comment ${commentId} on ${repository}: ${response.status} ${response.data?.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error(
        `Failed to update comment ${commentId} for ${repository}:`,
        error,
      );
      throw error;
    }
  }

  // TODO: Phase 2 - Implement these private helper methods
  // private async fetchForgejoIssue(owner: string, repo: string, number: string): Promise<ForgeIssue>
  // private async fetchForgejoPullRequest(owner: string, repo: string, number: string): Promise<ForgePullRequest>
  // private async fetchForgejoComments(owner: string, repo: string, number: string): Promise<ForgeComment[]>
  // private async fetchForgejoCommits(owner: string, repo: string, number: string): Promise<ForgeCommit[]>
  // private async fetchForgejoFiles(owner: string, repo: string, number: string): Promise<ForgeFile[]>
  // private convertForgejoDataToForgeTypes(data: any): ForgePullRequest | ForgeIssue
}
