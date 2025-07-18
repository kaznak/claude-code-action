import { expect, test, describe, beforeEach, mock } from "bun:test";
import type { GitForgeProvider, GitForgeConfig } from "../../src/github/providers/interface";
import type { 
  FetchDataResult, 
  FetchDataParams,
  ForgePullRequest,
  ForgeIssue
} from "../../src/github/providers/types";

/**
 * Test implementation of GitForgeProvider for testing purposes
 */
class MockGitForgeProvider implements GitForgeProvider {
  constructor(private mockData: Partial<FetchDataResult> = {}) {}

  getProviderType(): string {
    return 'mock';
  }

  async fetchData(params: FetchDataParams): Promise<FetchDataResult> {
    const defaultResult: FetchDataResult = {
      contextData: {
        title: "Test PR",
        body: "Test body",
        author: { login: "test-user" },
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
        reviews: { nodes: [] }
      } as ForgePullRequest,
      comments: [],
      changedFiles: [],
      changedFilesWithSHA: [],
      reviewData: null,
      imageUrlMap: new Map(),
      triggerDisplayName: null,
    };

    return { ...defaultResult, ...this.mockData };
  }

  async fetchUserDisplayName(login: string): Promise<string | null> {
    return login === "test-user" ? "Test User" : null;
  }

  async createComment(repository: string, number: string, body: string): Promise<void> {
    // Mock implementation
  }

  async updateComment(repository: string, commentId: string, body: string): Promise<void> {
    // Mock implementation
  }
}

describe("GitForgeProvider Interface", () => {
  test("provider should implement all required methods", () => {
    const provider = new MockGitForgeProvider();
    
    expect(typeof provider.getProviderType).toBe("function");
    expect(typeof provider.fetchData).toBe("function");
    expect(typeof provider.fetchUserDisplayName).toBe("function");
    expect(typeof provider.createComment).toBe("function");
    expect(typeof provider.updateComment).toBe("function");
  });

  test("fetchData should return expected structure", async () => {
    const provider = new MockGitForgeProvider();
    const result = await provider.fetchData({
      repository: "owner/repo",
      prNumber: "123",
      isPR: true,
    });

    expect(result).toHaveProperty("contextData");
    expect(result).toHaveProperty("comments");
    expect(result).toHaveProperty("changedFiles");
    expect(result).toHaveProperty("changedFilesWithSHA");
    expect(result).toHaveProperty("reviewData");
    expect(result).toHaveProperty("imageUrlMap");
    expect(result).toHaveProperty("triggerDisplayName");
  });

  test("fetchUserDisplayName should return name or null", async () => {
    const provider = new MockGitForgeProvider();
    
    const name = await provider.fetchUserDisplayName("test-user");
    expect(name).toBe("Test User");
    
    const nullName = await provider.fetchUserDisplayName("unknown-user");
    expect(nullName).toBeNull();
  });
});