import { describe, it, expect, beforeAll } from "bun:test";
import { createGitForgeProviderFromEnv } from "../../src/github/providers/factory";
import type { GitForgeProvider } from "../../src/github/providers/interface";
import type { FetchDataParams } from "../../src/github/providers/types";

// Cross-provider compatibility tests
// These tests ensure that both GitHub and Forgejo providers
// return data in compatible formats

// Check if we have the necessary tokens for integration testing
const HAS_GITHUB_TOKEN = process.env.GITHUB_TOKEN !== undefined;
const HAS_FORGEJO_TOKEN = process.env.FORGEJO_TEST_TOKEN !== undefined;
const HAS_ANY_TOKEN = HAS_GITHUB_TOKEN || HAS_FORGEJO_TOKEN;

describe.skipIf(!HAS_ANY_TOKEN)("Provider Compatibility Tests", () => {
  let provider: GitForgeProvider;
  let testRepo: string;
  let testPrNumber: string;
  let testIssueNumber: string;

  beforeAll(() => {
    // This will create either GitHub or Forgejo provider based on environment
    provider = createGitForgeProviderFromEnv();

    // Set test data based on provider type
    if (provider.getProviderType() === "forgejo") {
      testRepo = process.env.FORGEJO_TEST_REPO || "forgejo/forgejo";
      testPrNumber = process.env.FORGEJO_TEST_PR_NUMBER || "1";
      testIssueNumber = process.env.FORGEJO_TEST_ISSUE_NUMBER || "1";
    } else {
      // GitHub
      testRepo = process.env.GITHUB_TEST_REPO || "octocat/Hello-World";
      testPrNumber = process.env.GITHUB_TEST_PR_NUMBER || "1";
      testIssueNumber = process.env.GITHUB_TEST_ISSUE_NUMBER || "1";
    }
  });

  describe("Data Structure Compatibility", () => {
    it("should return consistent PR data structure", async () => {
      const params: FetchDataParams = {
        repository: testRepo,
        prNumber: testPrNumber,
        isPR: true,
      };

      const result = await provider.fetchData(params);

      // Verify standard structure that both providers should return
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      // Context data validation
      expect(result.contextData).toBeDefined();
      expect(typeof result.contextData.title).toBe("string");
      expect(result.contextData.title.length).toBeGreaterThan(0);

      expect(result.contextData.author).toBeDefined();
      expect(typeof result.contextData.author.login).toBe("string");
      expect(typeof result.contextData.author.name).toBe("string");

      // Type assertion since we know this is PR data
      const prData = result.contextData as any;
      expect(typeof prData.baseRefName).toBe("string");
      expect(typeof prData.headRefName).toBe("string");
      expect(typeof prData.headRefOid).toBe("string");

      expect(typeof result.contextData.state).toBe("string");
      expect(["open", "closed", "merged"]).toContain(result.contextData.state);

      expect(typeof prData.additions).toBe("number");
      expect(typeof prData.deletions).toBe("number");

      // Collections validation
      expect(Array.isArray(result.changedFiles)).toBe(true);
      expect(Array.isArray(result.comments)).toBe(true);

      // Changed files structure
      if (result.changedFiles.length > 0) {
        const file = result.changedFiles[0]!;
        expect(typeof file.path).toBe("string");
        expect(typeof file.additions).toBe("number");
        expect(typeof file.deletions).toBe("number");
        expect(typeof file.changeType).toBe("string");
      }

      // Comments structure
      if (result.comments.length > 0) {
        const comment = result.comments[0]!;
        expect(typeof comment.id).toBe("string");
        expect(typeof comment.databaseId).toBe("string");
        expect(typeof comment.body).toBe("string");
        expect(typeof comment.author.login).toBe("string");
        expect(typeof comment.author.name).toBe("string");
        expect(typeof comment.createdAt).toBe("string");
      }

      console.log(
        `✅ ${provider.getProviderType()} provider returned valid PR structure`,
      );
    });

    it("should return consistent Issue data structure", async () => {
      const params: FetchDataParams = {
        repository: testRepo,
        prNumber: testIssueNumber,
        isPR: false,
      };

      const result = await provider.fetchData(params);

      // Verify standard structure
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      // Context data validation
      expect(result.contextData).toBeDefined();
      expect(typeof result.contextData.title).toBe("string");
      expect(result.contextData.title.length).toBeGreaterThan(0);

      expect(result.contextData.author).toBeDefined();
      expect(typeof result.contextData.author.login).toBe("string");
      expect(typeof result.contextData.author.name).toBe("string");

      expect(typeof result.contextData.state).toBe("string");
      expect(["open", "closed"]).toContain(result.contextData.state);

      // Issue-specific expectations
      expect(result.changedFiles).toHaveLength(0);
      expect(result.reviewData).toBeNull();

      // Collections validation
      expect(Array.isArray(result.comments)).toBe(true);

      console.log(
        `✅ ${provider.getProviderType()} provider returned valid Issue structure`,
      );
    });

    it("should handle user display name consistently", async () => {
      const testUsername =
        provider.getProviderType() === "forgejo"
          ? process.env.FORGEJO_TEST_USERNAME || "forgejo"
          : process.env.GITHUB_TEST_USERNAME || "octocat";

      const displayName = await provider.fetchUserDisplayName(testUsername);

      if (displayName !== null) {
        expect(typeof displayName).toBe("string");
        expect(displayName.length).toBeGreaterThan(0);
      }

      console.log(
        `✅ ${provider.getProviderType()} provider handled user lookup: ${displayName || "null"}`,
      );
    });
  });

  describe("Error Handling Compatibility", () => {
    it("should handle non-existent repository consistently", async () => {
      const params: FetchDataParams = {
        repository: "non-existent-org/non-existent-repo",
        prNumber: "1",
        isPR: true,
      };

      await expect(provider.fetchData(params)).rejects.toThrow();
      console.log(
        `✅ ${provider.getProviderType()} provider correctly rejects non-existent repo`,
      );
    });

    it("should handle invalid repository format consistently", async () => {
      const params: FetchDataParams = {
        repository: "invalid-format",
        prNumber: "1",
        isPR: true,
      };

      await expect(provider.fetchData(params)).rejects.toThrow();
      console.log(
        `✅ ${provider.getProviderType()} provider correctly rejects invalid repo format`,
      );
    });

    it("should handle non-existent PR/Issue consistently", async () => {
      const params: FetchDataParams = {
        repository: testRepo,
        prNumber: "999999",
        isPR: true,
      };

      await expect(provider.fetchData(params)).rejects.toThrow();
      console.log(
        `✅ ${provider.getProviderType()} provider correctly rejects non-existent PR`,
      );
    });
  });

  describe("Performance Compatibility", () => {
    it("should complete operations within reasonable time", async () => {
      const startTime = Date.now();

      const params: FetchDataParams = {
        repository: testRepo,
        prNumber: testPrNumber,
        isPR: true,
      };

      await provider.fetchData(params);

      const duration = Date.now() - startTime;

      console.log(
        `${provider.getProviderType()} provider completed fetch in ${duration}ms`,
      );

      // Both providers should be reasonably fast
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });
  });

  describe("Provider Type Detection", () => {
    it("should correctly identify provider type", () => {
      const providerType = provider.getProviderType();
      expect(["github", "forgejo"]).toContain(providerType);

      console.log(`✅ Detected provider type: ${providerType}`);
    });

    it("should provide consistent provider interface", () => {
      // Check that all required methods exist
      expect(typeof provider.fetchData).toBe("function");
      expect(typeof provider.fetchUserDisplayName).toBe("function");
      expect(typeof provider.createComment).toBe("function");
      expect(typeof provider.updateComment).toBe("function");
      expect(typeof provider.getProviderType).toBe("function");

      console.log(
        `✅ ${provider.getProviderType()} provider implements all required methods`,
      );
    });
  });
});

// Mock compatibility tests that run without tokens
describe("Provider Compatibility Info", () => {
  it("should show integration test requirements", () => {
    expect(true).toBe(true);

    if (!HAS_ANY_TOKEN) {
      console.log(
        "\nProvider Compatibility Tests skipped - no authentication tokens found.",
      );
      console.log("To run compatibility tests, set one of:");
      console.log("- GITHUB_TOKEN for GitHub provider testing");
      console.log(
        "- FORGEJO_TEST_TOKEN + FORGEJO_TEST_API_URL for Forgejo provider testing",
      );
    } else if (HAS_GITHUB_TOKEN && !HAS_FORGEJO_TOKEN) {
      console.log(
        "GitHub provider testing available. Set FORGEJO_TEST_TOKEN for Forgejo testing.",
      );
    } else if (HAS_FORGEJO_TOKEN && !HAS_GITHUB_TOKEN) {
      console.log(
        "Forgejo provider testing available. Set GITHUB_TOKEN for GitHub testing.",
      );
    } else {
      console.log("Both GitHub and Forgejo provider testing available.");
    }
  });
});
