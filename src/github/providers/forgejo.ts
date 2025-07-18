import type { GitForgeProvider, GitForgeConfig } from "./interface";
import type {
  FetchDataResult,
  FetchDataParams,
} from "./types";

/**
 * Forgejo provider implementation using REST API
 * This is a skeleton implementation that will be completed in Phase 2
 */
export class ForgejoProvider implements GitForgeProvider {
  constructor(_config: GitForgeConfig) {
    // Config will be used in Phase 2 implementation
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
    // TODO: Implement using Forgejo REST API
    // GET /api/v1/users/{username}

    console.warn(
      `Forgejo fetchUserDisplayName not yet implemented for ${login}`,
    );
    return null;
  }

  async createComment(
    repository: string,
    number: string,
    _body: string,
  ): Promise<void> {
    // TODO: Implement using Forgejo REST API
    // POST /api/v1/repos/{owner}/{repo}/issues/{index}/comments

    console.warn(
      `Forgejo createComment not yet implemented for ${repository}#${number}`,
    );
    throw new Error("Forgejo createComment not yet implemented");
  }

  async updateComment(
    _repository: string,
    commentId: string,
    _body: string,
  ): Promise<void> {
    // TODO: Implement using Forgejo REST API
    // PATCH /api/v1/repos/{owner}/{repo}/issues/comments/{id}

    console.warn(
      `Forgejo updateComment not yet implemented for comment ${commentId}`,
    );
    throw new Error("Forgejo updateComment not yet implemented");
  }

  // TODO: Phase 2 - Implement these private helper methods
  // private async fetchForgejoIssue(owner: string, repo: string, number: string): Promise<ForgeIssue>
  // private async fetchForgejoPullRequest(owner: string, repo: string, number: string): Promise<ForgePullRequest>
  // private async fetchForgejoComments(owner: string, repo: string, number: string): Promise<ForgeComment[]>
  // private async fetchForgejoCommits(owner: string, repo: string, number: string): Promise<ForgeCommit[]>
  // private async fetchForgejoFiles(owner: string, repo: string, number: string): Promise<ForgeFile[]>
  // private convertForgejoDataToForgeTypes(data: any): ForgePullRequest | ForgeIssue
}
