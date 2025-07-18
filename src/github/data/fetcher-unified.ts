import { createOctokit } from "../api/client";
import { FORGE_TYPE } from "../api/config";
import { createGitForgeProviderFromEnv } from "../providers";
import type { FetchDataResult, FetchDataParams } from "../providers";

/**
 * Unified data fetcher that works with any Git forge provider
 */
export async function fetchForgeData(
  params: FetchDataParams,
): Promise<FetchDataResult> {
  const provider = createGitForgeProviderFromEnv(
    FORGE_TYPE === "github"
      ? createOctokit(process.env.GITHUB_TOKEN || "")
      : undefined,
  );

  return await provider.fetchData(params);
}

/**
 * Fetch user display name using the configured provider
 */
export async function fetchUserDisplayName(
  login: string,
): Promise<string | null> {
  const provider = createGitForgeProviderFromEnv(
    FORGE_TYPE === "github"
      ? createOctokit(process.env.GITHUB_TOKEN || "")
      : undefined,
  );

  return await provider.fetchUserDisplayName(login);
}

/**
 * Create a comment using the configured provider
 */
export async function createComment(
  repository: string,
  number: string,
  body: string,
): Promise<void> {
  const provider = createGitForgeProviderFromEnv(
    FORGE_TYPE === "github"
      ? createOctokit(process.env.GITHUB_TOKEN || "")
      : undefined,
  );

  return await provider.createComment(repository, number, body);
}

/**
 * Update a comment using the configured provider
 */
export async function updateComment(
  repository: string,
  commentId: string,
  body: string,
): Promise<void> {
  const provider = createGitForgeProviderFromEnv(
    FORGE_TYPE === "github"
      ? createOctokit(process.env.GITHUB_TOKEN || "")
      : undefined,
  );

  return await provider.updateComment(repository, commentId, body);
}

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use fetchForgeData instead
 */
export async function fetchGitHubData(params: {
  octokits: any;
  repository: string;
  prNumber: string;
  isPR: boolean;
  triggerUsername?: string;
}): Promise<FetchDataResult> {
  console.warn("fetchGitHubData is deprecated. Use fetchForgeData instead.");

  const forgeParams: FetchDataParams = {
    repository: params.repository,
    prNumber: params.prNumber,
    isPR: params.isPR,
    triggerUsername: params.triggerUsername,
  };

  return await fetchForgeData(forgeParams);
}

// Export types for backward compatibility
export type { FetchDataResult, FetchDataParams } from "../providers";

// Re-export GitHubFileWithSHA for backward compatibility
export type GitHubFileWithSHA = {
  path: string;
  additions: number;
  deletions: number;
  changeType: string;
  sha: string;
};
