import type { GitForgeProvider, GitForgeConfig } from "./interface";
import type { FetchDataResult, FetchDataParams } from "./types";
import { ForgejoApiClient } from "./forgejo-client";
import {
  mapForgejoPullRequest,
  mapForgejoIssue,
  type ForgejoPullRequest,
  type ForgejoIssue,
  type ForgejoComment,
  type ForgejoCommit,
  type ForgejoFile,
  type ForgejoReview,
  type ForgejoReviewComment,
} from "../mappers/forgejo";

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

  async fetchData(params: FetchDataParams): Promise<FetchDataResult> {
    const { repository, prNumber, isPR, triggerUsername } = params;

    const parts = repository.split("/");
    if (parts.length !== 2) {
      throw new Error(`Invalid repository format: ${repository}`);
    }
    const [owner, repo] = parts;

    try {
      if (isPR) {
        return await this.fetchPullRequestData(
          owner,
          repo,
          prNumber,
          triggerUsername ?? undefined,
        );
      } else {
        return await this.fetchIssueData(
          owner,
          repo,
          prNumber,
          triggerUsername ?? undefined,
        );
      }
    } catch (error) {
      console.error(
        `Failed to fetch data for ${repository}${isPR ? "#" : "/issues/"}${prNumber}:`,
        error,
      );
      throw error;
    }
  }

  private async fetchPullRequestData(
    owner: string,
    repo: string,
    prNumber: string,
    triggerUsername?: string,
  ): Promise<FetchDataResult> {
    // Fetch pull request data using multiple REST API calls
    const [prResponse, commitsResponse, filesResponse, commentsResponse] =
      await Promise.all([
        this.client.get(`/repos/${owner}/${repo}/pulls/${prNumber}`),
        this.client.get(`/repos/${owner}/${repo}/pulls/${prNumber}/commits`),
        this.client.get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`),
        this.client.get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`),
      ]);

    if (!prResponse.ok) {
      throw new Error(`Failed to fetch pull request: ${prResponse.status}`);
    }

    const prData = prResponse.data as ForgejoPullRequest;
    const commits = (
      commitsResponse.ok ? commitsResponse.data : []
    ) as ForgejoCommit[];
    const files = (filesResponse.ok ? filesResponse.data : []) as ForgejoFile[];
    const comments = (
      commentsResponse.ok ? commentsResponse.data : []
    ) as ForgejoComment[];

    // Try to fetch reviews (may not be available on all Forgejo instances)
    let reviews: ForgejoReview[] = [];
    let reviewComments: ForgejoReviewComment[] = [];

    try {
      const reviewsResponse = await this.client.get(
        `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      );
      if (reviewsResponse.ok) {
        reviews = reviewsResponse.data as ForgejoReview[];
      }

      const reviewCommentsResponse = await this.client.get(
        `/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
      );
      if (reviewCommentsResponse.ok) {
        reviewComments = reviewCommentsResponse.data as ForgejoReviewComment[];
      }
    } catch (error) {
      console.warn(
        `Could not fetch reviews for ${owner}/${repo}#${prNumber}:`,
        error,
      );
    }

    // Convert to unified format
    const contextData = mapForgejoPullRequest(
      prData,
      commits,
      files,
      comments,
      reviews,
      reviewComments,
    );

    // Get user display name if trigger username is provided
    let triggerDisplayName: string | null = null;
    if (triggerUsername) {
      triggerDisplayName = await this.fetchUserDisplayName(triggerUsername);
    }

    return {
      contextData,
      comments: contextData.comments.nodes,
      changedFiles: contextData.files.nodes,
      changedFilesWithSHA: contextData.files.nodes.map((file) => ({
        ...file,
        sha: prData.head.sha,
      })),
      reviewData:
        contextData.reviews.nodes.length > 0 ? contextData.reviews : null,
      imageUrlMap: new Map(), // TODO: Implement image URL mapping
      triggerDisplayName,
    };
  }

  private async fetchIssueData(
    owner: string,
    repo: string,
    issueNumber: string,
    triggerUsername?: string,
  ): Promise<FetchDataResult> {
    // Fetch issue data using REST API calls
    const [issueResponse, commentsResponse] = await Promise.all([
      this.client.get(`/repos/${owner}/${repo}/issues/${issueNumber}`),
      this.client.get(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`),
    ]);

    if (!issueResponse.ok) {
      throw new Error(`Failed to fetch issue: ${issueResponse.status}`);
    }

    const issueData = issueResponse.data as ForgejoIssue;
    const comments = (
      commentsResponse.ok ? commentsResponse.data : []
    ) as ForgejoComment[];

    // Convert to unified format
    const contextData = mapForgejoIssue(issueData, comments);

    // Get user display name if trigger username is provided
    let triggerDisplayName: string | null = null;
    if (triggerUsername) {
      triggerDisplayName = await this.fetchUserDisplayName(triggerUsername);
    }

    return {
      contextData,
      comments: contextData.comments.nodes,
      changedFiles: [], // Issues don't have changed files
      changedFilesWithSHA: [], // Issues don't have changed files
      reviewData: null, // Issues don't have reviews
      imageUrlMap: new Map(), // TODO: Implement image URL mapping
      triggerDisplayName,
    };
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
          `Failed to create comment on ${repository}#${number}: ${response.status} ${response.data?.message || "Unknown error"}`,
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
          `Failed to update comment ${commentId} on ${repository}: ${response.status} ${response.data?.message || "Unknown error"}`,
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
