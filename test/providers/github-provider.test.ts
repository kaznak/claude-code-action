import { expect, test, describe, beforeEach, mock } from "bun:test";
import { GitHubProvider } from "../../src/github/providers/github";
import type { Octokits } from "../../src/github/api/client";
import type { GitForgeConfig } from "../../src/github/providers/interface";

describe("GitHubProvider", () => {
  let mockOctokits: Octokits;
  let config: GitForgeConfig;
  let provider: GitHubProvider;

  beforeEach(() => {
    // Mock Octokits instance
    mockOctokits = {
      rest: {
        issues: {
          createComment: mock(() => Promise.resolve()),
          updateComment: mock(() => Promise.resolve()),
        },
        pulls: {
          get: mock(() => Promise.resolve({ data: {} })),
          listCommits: mock(() => Promise.resolve({ data: [] })),
          listFiles: mock(() => Promise.resolve({ data: [] })),
        },
      },
      graphql: mock(() =>
        Promise.resolve({
          repository: {
            pullRequest: {
              title: "Test PR",
              body: "Test body",
              author: { login: "test-user", name: "Test User" },
              baseRefName: "main",
              headRefName: "feature/test",
              headRefOid: "abc123",
              createdAt: "2023-01-01T00:00:00Z",
              additions: 50,
              deletions: 30,
              state: "OPEN",
              commits: { totalCount: 1, nodes: [] },
              files: { nodes: [] },
              comments: { nodes: [] },
              reviews: { nodes: [] },
            },
          },
        }),
      ),
    } as unknown as Octokits;

    config = {
      type: "github",
      apiUrl: "https://api.github.com",
      serverUrl: "https://github.com",
      token: "test-token",
    };

    provider = new GitHubProvider(mockOctokits, config);
  });

  test("getProviderType returns 'github'", () => {
    expect(provider.getProviderType()).toBe("github");
  });

  test("fetchData fetches PR data using GraphQL", async () => {
    const result = await provider.fetchData({
      repository: "owner/repo",
      prNumber: "123",
      isPR: true,
    });

    expect(mockOctokits.graphql).toHaveBeenCalled();
    expect(result.contextData).toBeDefined();
    expect(result.contextData.title).toBe("Test PR");
  });

  test("fetchUserDisplayName fetches user data", async () => {
    const mockGraphql = mock(() =>
      Promise.resolve({
        user: { name: "Test User Display" },
      }),
    );
    (mockOctokits as any).graphql = mockGraphql;

    const name = await provider.fetchUserDisplayName("test-user");
    expect(name).toBe("Test User Display");
  });

  test("createComment calls REST API", async () => {
    await provider.createComment("owner/repo", "123", "Test comment");

    expect(mockOctokits.rest.issues.createComment).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 123,
      body: "Test comment",
    });
  });

  test("updateComment calls REST API", async () => {
    await provider.updateComment("owner/repo", "456", "Updated comment");

    expect(mockOctokits.rest.issues.updateComment).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      comment_id: 456,
      body: "Updated comment",
    });
  });

  test("handles invalid repository format", async () => {
    await expect(
      provider.fetchData({
        repository: "invalid-format",
        prNumber: "123",
        isPR: true,
      }),
    ).rejects.toThrow("Invalid repository format");
  });

  test("converts GitHub types to forge types correctly", async () => {
    const result = await provider.fetchData({
      repository: "owner/repo",
      prNumber: "123",
      isPR: true,
    });

    // Check that the data has been converted to forge types
    expect(result.contextData).toHaveProperty("title", "Test PR");
    expect(result.contextData).toHaveProperty("author");
    expect(result.contextData.author).toHaveProperty("login", "test-user");
  });
});
