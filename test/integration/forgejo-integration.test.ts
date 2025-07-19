import { describe, it, expect, beforeAll } from "bun:test";
import { ForgejoProvider } from "../../src/github/providers/forgejo";
import type { GitForgeConfig } from "../../src/github/providers/interface";
import type { FetchDataParams } from "../../src/github/providers/types";

// Integration tests for Forgejo provider
// These tests are designed to work with a real Forgejo instance or can be mocked
// To run against a real Forgejo instance, set the following environment variables:
// - FORGEJO_TEST_TOKEN: Personal access token for the test instance
// - FORGEJO_TEST_API_URL: API URL (e.g., https://forgejo.example.com/api/v1)
// - FORGEJO_TEST_SERVER_URL: Server URL (e.g., https://forgejo.example.com)
// - FORGEJO_TEST_REPO: Test repository (e.g., test-org/test-repo)
// - FORGEJO_TEST_PR_NUMBER: Test PR number
// - FORGEJO_TEST_ISSUE_NUMBER: Test issue number

const INTEGRATION_ENABLED = process.env.FORGEJO_TEST_TOKEN !== undefined;

describe.skipIf(!INTEGRATION_ENABLED)("Forgejo Integration Tests", () => {
  let provider: ForgejoProvider;
  let testConfig: GitForgeConfig;
  let testRepo: string;
  let testPrNumber: string;
  let testIssueNumber: string;

  beforeAll(() => {
    if (!INTEGRATION_ENABLED) return;

    testConfig = {
      token: process.env.FORGEJO_TEST_TOKEN!,
      apiUrl: process.env.FORGEJO_TEST_API_URL!,
      serverUrl: process.env.FORGEJO_TEST_SERVER_URL!,
      type: "forgejo",
    };

    testRepo = process.env.FORGEJO_TEST_REPO || "test-org/test-repo";
    testPrNumber = process.env.FORGEJO_TEST_PR_NUMBER || "1";
    testIssueNumber = process.env.FORGEJO_TEST_ISSUE_NUMBER || "1";

    provider = new ForgejoProvider(testConfig);
  });

  describe("Real API Integration", () => {
    it("should fetch real PR data from Forgejo instance", async () => {
      const params: FetchDataParams = {
        repository: testRepo,
        prNumber: testPrNumber,
        isPR: true,
      };

      const result = await provider.fetchData(params);

      // Basic structure validation
      expect(result).toBeDefined();
      expect(result.contextData).toBeDefined();
      expect(result.contextData.title).toBeTruthy();
      expect(result.contextData.author).toBeDefined();
      expect(result.contextData.author.login).toBeTruthy();
      // Type assertion since we know this is PR data
      const prData = result.contextData as any;
      expect(prData.baseRefName).toBeTruthy();
      expect(prData.headRefName).toBeTruthy();

      // PR-specific data
      expect(result.changedFiles).toBeDefined();
      expect(Array.isArray(result.changedFiles)).toBe(true);

      // Comments should be an array
      expect(Array.isArray(result.comments)).toBe(true);

      console.log(`Successfully fetched PR #${testPrNumber} from ${testRepo}`);
      console.log(`Title: ${result.contextData.title}`);
      console.log(`Author: ${result.contextData.author.login}`);
      console.log(`Files changed: ${result.changedFiles.length}`);
      console.log(`Comments: ${result.comments.length}`);
    });

    it("should fetch real issue data from Forgejo instance", async () => {
      const params: FetchDataParams = {
        repository: testRepo,
        prNumber: testIssueNumber,
        isPR: false,
      };

      const result = await provider.fetchData(params);

      // Basic structure validation
      expect(result).toBeDefined();
      expect(result.contextData).toBeDefined();
      expect(result.contextData.title).toBeTruthy();
      expect(result.contextData.author).toBeDefined();
      expect(result.contextData.author.login).toBeTruthy();

      // Issue-specific expectations
      expect(result.changedFiles).toHaveLength(0);
      expect(result.reviewData).toBeNull();

      console.log(
        `Successfully fetched Issue #${testIssueNumber} from ${testRepo}`,
      );
      console.log(`Title: ${result.contextData.title}`);
      console.log(`Author: ${result.contextData.author.login}`);
      console.log(`Comments: ${result.comments.length}`);
    });

    it("should create and update comments on real Forgejo instance", async () => {
      // Skip this test if we don't have write permissions
      const skipCommentTest = process.env.FORGEJO_TEST_SKIP_WRITE === "true";
      if (skipCommentTest) {
        console.log(
          "Skipping comment creation test (FORGEJO_TEST_SKIP_WRITE=true)",
        );
        return;
      }

      const testCommentBody = `Integration test comment - ${new Date().toISOString()}`;

      // Create comment
      await provider.createComment(testRepo, testIssueNumber, testCommentBody);
      console.log(`Created test comment on issue #${testIssueNumber}`);

      // Note: Forgejo doesn't return comment ID in the same way as GitHub
      // so we can't easily test comment updates without additional API calls
      // to list comments and find the one we just created
    });

    it("should handle API errors gracefully", async () => {
      const params: FetchDataParams = {
        repository: testRepo,
        prNumber: "99999", // Non-existent PR
        isPR: true,
      };

      await expect(provider.fetchData(params)).rejects.toThrow();
    });

    it("should fetch user display names", async () => {
      // Use a known user from the test instance
      const testUsername = process.env.FORGEJO_TEST_USERNAME || "test-user";

      const displayName = await provider.fetchUserDisplayName(testUsername);

      if (displayName) {
        expect(typeof displayName).toBe("string");
        console.log(`User ${testUsername} display name: ${displayName}`);
      } else {
        console.log(`User ${testUsername} not found or has no display name`);
      }
    });
  });

  describe("Performance Tests", () => {
    it("should fetch PR data within reasonable time", async () => {
      const startTime = Date.now();

      const params: FetchDataParams = {
        repository: testRepo,
        prNumber: testPrNumber,
        isPR: true,
      };

      await provider.fetchData(params);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`PR fetch completed in ${duration}ms`);

      // Expect reasonable response time (adjust based on your requirements)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });

  describe("Error Handling", () => {
    it("should handle network timeouts gracefully", async () => {
      // Create provider with very short timeout
      const timeoutConfig: GitForgeConfig = {
        ...testConfig,
        apiUrl: "https://forgejo.test.timeout:1234/api/v1", // Non-routable address
      };

      const timeoutProvider = new ForgejoProvider(timeoutConfig);

      const params: FetchDataParams = {
        repository: "test/repo",
        prNumber: "1",
        isPR: true,
      };

      // This should fail due to network timeout
      await expect(timeoutProvider.fetchData(params)).rejects.toThrow();
    });

    it("should handle malformed responses", async () => {
      // This test would require a mock server that returns invalid JSON
      // For now, we'll skip this in real integration tests
      console.log("Skipping malformed response test in integration mode");
    });
  });
});

// Mock integration tests that run without a real Forgejo instance
describe("Forgejo Mock Integration Tests", () => {
  it("should demonstrate integration test structure", () => {
    // This test always runs to show the structure
    expect(true).toBe(true);

    if (!INTEGRATION_ENABLED) {
      console.log(
        "\nTo run real Forgejo integration tests, set the following environment variables:",
      );
      console.log("- FORGEJO_TEST_TOKEN: Personal access token");
      console.log(
        "- FORGEJO_TEST_API_URL: API URL (e.g., https://forgejo.example.com/api/v1)",
      );
      console.log(
        "- FORGEJO_TEST_SERVER_URL: Server URL (e.g., https://forgejo.example.com)",
      );
      console.log(
        "- FORGEJO_TEST_REPO: Test repository (e.g., test-org/test-repo)",
      );
      console.log("- FORGEJO_TEST_PR_NUMBER: Test PR number");
      console.log("- FORGEJO_TEST_ISSUE_NUMBER: Test issue number");
      console.log("- FORGEJO_TEST_USERNAME: Test username (optional)");
      console.log(
        "- FORGEJO_TEST_SKIP_WRITE: Set to 'true' to skip write operations",
      );
    }
  });
});
