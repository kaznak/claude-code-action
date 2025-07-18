import { execSync } from "child_process";
import type { Octokits } from "../api/client";
import { ISSUE_QUERY, PR_QUERY, USER_QUERY } from "../api/queries/github";
import type {
  GitHubComment,
  GitHubFile,
  GitHubIssue,
  GitHubPullRequest,
  GitHubReview,
  IssueQueryResponse,
  PullRequestQueryResponse,
} from "../types";
import type { CommentWithImages } from "../utils/image-downloader";
import { downloadCommentImages } from "../utils/image-downloader";
import type { GitForgeProvider, GitForgeConfig } from "./interface";
import type {
  FetchDataResult,
  FetchDataParams,
  ForgeFileWithSHA,
  ForgeAuthor,
  ForgeComment,
  ForgeCommit,
  ForgeFile,
  ForgeReview,
  ForgePullRequest,
  ForgeIssue,
} from "./types";

/**
 * GitHub provider implementation using GraphQL API
 */
export class GitHubProvider implements GitForgeProvider {
  constructor(
    private octokits: Octokits,
    _config: GitForgeConfig,
  ) {
    // Config will be used for future enhancements
  }

  getProviderType(): string {
    return "github";
  }

  async fetchData(params: FetchDataParams): Promise<FetchDataResult> {
    const { repository, prNumber, isPR, triggerUsername } = params;
    const [owner, repo] = repository.split("/");

    if (!owner || !repo) {
      throw new Error("Invalid repository format. Expected 'owner/repo'.");
    }

    let contextData: GitHubPullRequest | GitHubIssue | null = null;
    let comments: GitHubComment[] = [];
    let changedFiles: GitHubFile[] = [];
    let reviewData: { nodes: GitHubReview[] } | null = null;

    try {
      if (isPR) {
        // Fetch PR data with all comments and file information
        const prResult = await this.octokits.graphql<PullRequestQueryResponse>(
          PR_QUERY,
          {
            owner,
            repo,
            number: parseInt(prNumber),
          },
        );

        if (prResult.repository.pullRequest) {
          const pullRequest = prResult.repository.pullRequest;
          contextData = pullRequest;
          changedFiles = pullRequest.files.nodes || [];
          comments = pullRequest.comments?.nodes || [];
          reviewData = pullRequest.reviews || [];

          console.log(`Successfully fetched PR #${prNumber} data`);
        } else {
          throw new Error(`PR #${prNumber} not found`);
        }
      } else {
        // Fetch issue data
        const issueResult = await this.octokits.graphql<IssueQueryResponse>(
          ISSUE_QUERY,
          {
            owner,
            repo,
            number: parseInt(prNumber),
          },
        );

        if (issueResult.repository.issue) {
          contextData = issueResult.repository.issue;
          comments = contextData?.comments?.nodes || [];

          console.log(`Successfully fetched issue #${prNumber} data`);
        } else {
          throw new Error(`Issue #${prNumber} not found`);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${isPR ? "PR" : "issue"} data:`, error);
      throw new Error(`Failed to fetch ${isPR ? "PR" : "issue"} data`);
    }

    // Compute SHAs for changed files
    let changedFilesWithSHA: ForgeFileWithSHA[] = [];
    if (isPR && changedFiles.length > 0) {
      changedFilesWithSHA = changedFiles.map((file) => {
        // Don't compute SHA for deleted files
        if (file.changeType === "DELETED") {
          return {
            ...file,
            sha: "deleted",
          };
        }

        try {
          // Use git hash-object to compute the SHA for the current file content
          const sha = execSync(`git hash-object "${file.path}"`, {
            encoding: "utf-8",
          }).trim();
          return {
            ...file,
            sha,
          };
        } catch (error) {
          console.warn(`Failed to compute SHA for ${file.path}:`, error);
          // Return original file without SHA if computation fails
          return {
            ...file,
            sha: "unknown",
          };
        }
      });
    }

    // Prepare all comments for image processing
    const issueComments: CommentWithImages[] = comments
      .filter((c) => c.body)
      .map((c) => ({
        type: "issue_comment" as const,
        id: c.databaseId,
        body: c.body,
      }));

    const reviewBodies: CommentWithImages[] =
      reviewData?.nodes
        ?.filter((r) => r.body)
        .map((r) => ({
          type: "review_body" as const,
          id: r.databaseId,
          pullNumber: prNumber,
          body: r.body,
        })) ?? [];

    const reviewComments: CommentWithImages[] =
      reviewData?.nodes
        ?.flatMap((r) => r.comments?.nodes ?? [])
        .filter((c) => c.body)
        .map((c) => ({
          type: "review_comment" as const,
          id: c.databaseId,
          body: c.body,
        })) ?? [];

    // Add the main issue/PR body if it has content
    const mainBody: CommentWithImages[] = contextData.body
      ? [
          {
            ...(isPR
              ? {
                  type: "pr_body" as const,
                  pullNumber: prNumber,
                  body: contextData.body,
                }
              : {
                  type: "issue_body" as const,
                  issueNumber: prNumber,
                  body: contextData.body,
                }),
          },
        ]
      : [];

    const allComments = [
      ...mainBody,
      ...issueComments,
      ...reviewBodies,
      ...reviewComments,
    ];

    const imageUrlMap = await downloadCommentImages(
      this.octokits,
      owner,
      repo,
      allComments,
    );

    // Fetch trigger user display name if username is provided
    let triggerDisplayName: string | null | undefined;
    if (triggerUsername) {
      triggerDisplayName = await this.fetchUserDisplayName(triggerUsername);
    }

    // Convert GitHub types to unified forge types
    return {
      contextData: this.convertToForgeData(contextData),
      comments: this.convertToForgeComments(comments),
      changedFiles: this.convertToForgeFiles(changedFiles),
      changedFilesWithSHA,
      reviewData: reviewData
        ? { nodes: this.convertToForgeReviews(reviewData.nodes) }
        : null,
      imageUrlMap,
      triggerDisplayName,
    };
  }

  async fetchUserDisplayName(login: string): Promise<string | null> {
    try {
      const result = await this.octokits.graphql<{
        user: { name: string | null };
      }>(USER_QUERY, { login });
      return result.user.name;
    } catch (error) {
      console.warn(`Failed to fetch user display name for ${login}:`, error);
      return null;
    }
  }

  async createComment(
    repository: string,
    number: string,
    body: string,
  ): Promise<void> {
    const [owner, repo] = repository.split("/");
    if (!owner || !repo) {
      throw new Error("Invalid repository format. Expected 'owner/repo'.");
    }

    await this.octokits.rest.issues.createComment({
      owner,
      repo,
      issue_number: parseInt(number),
      body,
    });
  }

  async updateComment(
    repository: string,
    commentId: string,
    body: string,
  ): Promise<void> {
    const [owner, repo] = repository.split("/");
    if (!owner || !repo) {
      throw new Error("Invalid repository format. Expected 'owner/repo'.");
    }

    await this.octokits.rest.issues.updateComment({
      owner,
      repo,
      comment_id: parseInt(commentId),
      body,
    });
  }

  // Private helper methods to convert GitHub types to unified forge types
  private convertToForgeData(
    data: GitHubPullRequest | GitHubIssue,
  ): ForgePullRequest | ForgeIssue {
    if ("baseRefName" in data) {
      // It's a PR
      return {
        ...data,
        author: this.convertToForgeAuthor(data.author),
        commits: {
          totalCount: data.commits.totalCount,
          nodes: data.commits.nodes.map((node) => ({
            commit: this.convertToForgeCommit(node.commit),
          })),
        },
        files: {
          nodes: this.convertToForgeFiles(data.files.nodes),
        },
        comments: {
          nodes: this.convertToForgeComments(data.comments.nodes),
        },
        reviews: {
          nodes: this.convertToForgeReviews(data.reviews.nodes),
        },
      } as ForgePullRequest;
    } else {
      // It's an issue
      return {
        ...data,
        author: this.convertToForgeAuthor(data.author),
        comments: {
          nodes: this.convertToForgeComments(data.comments.nodes),
        },
      } as ForgeIssue;
    }
  }

  private convertToForgeAuthor(author: {
    login: string;
    name?: string;
  }): ForgeAuthor {
    return {
      login: author.login,
      name: author.name,
    };
  }

  private convertToForgeComments(comments: GitHubComment[]): ForgeComment[] {
    return comments.map((comment) => ({
      id: comment.id,
      databaseId: comment.databaseId,
      body: comment.body,
      author: this.convertToForgeAuthor(comment.author),
      createdAt: comment.createdAt,
    }));
  }

  private convertToForgeFiles(files: GitHubFile[]): ForgeFile[] {
    return files.map((file) => ({
      path: file.path,
      additions: file.additions,
      deletions: file.deletions,
      changeType: file.changeType,
    }));
  }

  private convertToForgeCommit(commit: {oid: string; message: string; author: {name: string; email: string}}): ForgeCommit {
    return {
      oid: commit.oid,
      message: commit.message,
      author: {
        name: commit.author.name,
        email: commit.author.email,
      },
    };
  }

  private convertToForgeReviews(reviews: GitHubReview[]): ForgeReview[] {
    return reviews.map((review) => ({
      id: review.id,
      databaseId: review.databaseId,
      author: this.convertToForgeAuthor(review.author),
      body: review.body,
      state: review.state,
      submittedAt: review.submittedAt,
      comments: {
        nodes: review.comments.nodes.map((comment) => ({
          id: comment.id,
          databaseId: comment.databaseId,
          body: comment.body,
          author: this.convertToForgeAuthor(comment.author),
          createdAt: comment.createdAt,
          path: comment.path,
          line: comment.line,
        })),
      },
    }));
  }
}
