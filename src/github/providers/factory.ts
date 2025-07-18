import type { Octokits } from "../api/client";
import type { GitForgeProvider, GitForgeConfig } from "./interface";
import { GitHubProvider } from "./github";
import { ForgejoProvider } from "./forgejo";

/**
 * Factory function to create the appropriate Git forge provider
 */
export function createGitForgeProvider(
  type: "github" | "forgejo",
  config: GitForgeConfig,
  octokits?: Octokits,
): GitForgeProvider {
  switch (type) {
    case "github":
      if (!octokits) {
        throw new Error("Octokits instance is required for GitHub provider");
      }
      return new GitHubProvider(octokits, config);

    case "forgejo":
      return new ForgejoProvider(config);

    default:
      throw new Error(`Unknown Git forge provider type: ${type}`);
  }
}

/**
 * Create Git forge provider from environment variables
 */
export function createGitForgeProviderFromEnv(
  octokits?: Octokits,
): GitForgeProvider {
  const type = (process.env.FORGE_TYPE || "github") as "github" | "forgejo";
  const apiUrl =
    process.env.FORGE_API_URL ||
    (type === "github"
      ? "https://api.github.com"
      : "https://forgejo.example.com/api/v1");
  const serverUrl =
    process.env.FORGE_SERVER_URL ||
    (type === "github" ? "https://github.com" : "https://forgejo.example.com");
  const token = process.env.GITHUB_TOKEN || "";

  if (!token) {
    throw new Error(
      "Authentication token is required (GITHUB_TOKEN environment variable)",
    );
  }

  const config: GitForgeConfig = {
    type,
    apiUrl,
    serverUrl,
    token,
  };

  return createGitForgeProvider(type, config, octokits);
}

/**
 * Type guard to check if a provider is GitHub provider
 */
export function isGitHubProvider(
  provider: GitForgeProvider,
): provider is GitHubProvider {
  return provider.getProviderType() === "github";
}

/**
 * Type guard to check if a provider is Forgejo provider
 */
export function isForgejoProvider(
  provider: GitForgeProvider,
): provider is ForgejoProvider {
  return provider.getProviderType() === "forgejo";
}
