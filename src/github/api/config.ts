// Legacy GitHub-specific configuration (deprecated)
export const GITHUB_API_URL =
  process.env.GITHUB_API_URL || "https://api.github.com";
export const GITHUB_SERVER_URL =
  process.env.GITHUB_SERVER_URL || "https://github.com";

// New unified forge configuration
export const FORGE_TYPE = (process.env.FORGE_TYPE || "github") as
  | "github"
  | "forgejo";
export const FORGE_API_URL =
  process.env.FORGE_API_URL ||
  (FORGE_TYPE === "github"
    ? GITHUB_API_URL
    : "https://forgejo.example.com/api/v1");
export const FORGE_SERVER_URL =
  process.env.FORGE_SERVER_URL ||
  (FORGE_TYPE === "github" ? GITHUB_SERVER_URL : "https://forgejo.example.com");

/**
 * Get the appropriate API URL based on forge type
 */
export function getForgeApiUrl(forgeType?: "github" | "forgejo"): string {
  const type = forgeType || FORGE_TYPE;
  return type === "github" ? GITHUB_API_URL : FORGE_API_URL;
}

/**
 * Get the appropriate server URL based on forge type
 */
export function getForgeServerUrl(forgeType?: "github" | "forgejo"): string {
  const type = forgeType || FORGE_TYPE;
  return type === "github" ? GITHUB_SERVER_URL : FORGE_SERVER_URL;
}
