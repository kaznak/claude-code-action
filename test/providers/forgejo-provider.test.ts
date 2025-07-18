import { describe, it, expect, beforeEach, jest, spyOn } from "bun:test";
import { ForgejoProvider } from "../../src/github/providers/forgejo";
import type { GitForgeConfig } from "../../src/github/providers/interface";
import type { FetchDataParams } from "../../src/github/providers/types";

describe("ForgejoProvider", () => {
  let provider: ForgejoProvider;
  let mockConfig: GitForgeConfig;

  beforeEach(() => {
    mockConfig = {
      token: "test-token",
      apiUrl: "https://forgejo.example.com/api/v1",
      serverUrl: "https://forgejo.example.com",
      type: "forgejo",
    };
    provider = new ForgejoProvider(mockConfig);
  });

  describe("getProviderType", () => {
    it("should return 'forgejo'", () => {
      expect(provider.getProviderType()).toBe("forgejo");
    });
  });

  describe("fetchData", () => {
    it("should fetch PR data successfully", async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 1,
            number: 123,
            title: "Test PR",
            body: "Test body",
            user: { id: 1, login: "testuser", full_name: "Test User" },
            state: "open",
            created_at: "2023-01-01T00:00:00Z",
            base: { ref: "main", sha: "abc123" },
            head: { ref: "feature", sha: "def456" },
            additions: 10,
            deletions: 5,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              sha: "commit1",
              commit: {
                message: "Test commit",
                author: { name: "Test User", email: "test@example.com" },
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              filename: "test.js",
              additions: 10,
              deletions: 5,
              changes: 15,
              status: "modified",
            },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              id: 1,
              user: { id: 1, login: "testuser", full_name: "Test User" },
              body: "Test comment",
              created_at: "2023-01-01T01:00:00Z",
            },
          ],
        });

      global.fetch = mockFetch as any;

      const params: FetchDataParams = {
        repository: "test-owner/test-repo",
        prNumber: "123",
        isPR: true,
      };

      const result = await provider.fetchData(params);

      expect(result.contextData.title).toBe("Test PR");
      expect(result.contextData.author.login).toBe("testuser");
      expect(result.comments).toHaveLength(1);
      expect(result.changedFiles).toHaveLength(1);
      expect(result.changedFiles[0]?.path).toBe("test.js");
    });

    it("should fetch issue data successfully", async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 1,
            number: 123,
            title: "Test Issue",
            body: "Test issue body",
            user: { id: 1, login: "testuser", full_name: "Test User" },
            state: "open",
            created_at: "2023-01-01T00:00:00Z",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              id: 1,
              user: { id: 1, login: "testuser", full_name: "Test User" },
              body: "Test comment",
              created_at: "2023-01-01T01:00:00Z",
            },
          ],
        });

      global.fetch = mockFetch as any;

      const params: FetchDataParams = {
        repository: "test-owner/test-repo",
        prNumber: "123",
        isPR: false,
      };

      const result = await provider.fetchData(params);

      expect(result.contextData.title).toBe("Test Issue");
      expect(result.contextData.author.login).toBe("testuser");
      expect(result.comments).toHaveLength(1);
      expect(result.changedFiles).toHaveLength(0);
      expect(result.reviewData).toBeNull();
    });

    it("should handle API errors gracefully", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: "Not found" }),
      });
      global.fetch = mockFetch as any;

      const params: FetchDataParams = {
        repository: "test-owner/test-repo",
        prNumber: "999",
        isPR: true,
      };

      await expect(provider.fetchData(params)).rejects.toThrow(
        "Failed to fetch pull request: 404",
      );
    });

    it("should throw error for invalid repository format", async () => {
      const params: FetchDataParams = {
        repository: "invalid-repo",
        prNumber: "123",
        isPR: true,
      };

      await expect(provider.fetchData(params)).rejects.toThrow(
        "Invalid repository format: invalid-repo",
      );
    });
  });

  describe("constructor", () => {
    it("should return null when apiUrl is not provided", async () => {
      const invalidConfig = {
        token: "test-token",
        apiUrl: "",
        serverUrl: "https://forgejo.example.com",
        type: "forgejo" as const,
      };
      const invalidProvider = new ForgejoProvider(invalidConfig);
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

      const result = await invalidProvider.fetchUserDisplayName("testuser");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch user display name for testuser:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("fetchUserDisplayName", () => {
    it("should fetch user display name from Forgejo API", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          login: "testuser",
          full_name: "Test User",
        }),
      });
      global.fetch = mockFetch as any;

      const result = await provider.fetchUserDisplayName("testuser");

      expect(result).toBe("Test User");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://forgejo.example.com/api/v1/users/testuser",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "token test-token",
          }),
        }),
      );
    });

    it("should return null when user not found", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });
      global.fetch = mockFetch as any;

      const result = await provider.fetchUserDisplayName("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("createComment", () => {
    it("should create comment using Forgejo API", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 789 }),
      });
      global.fetch = mockFetch as any;

      await provider.createComment(
        "test-owner/test-repo",
        "123",
        "Test comment",
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://forgejo.example.com/api/v1/repos/test-owner/test-repo/issues/123/comments",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "token test-token",
          }),
          body: JSON.stringify({ body: "Test comment" }),
        }),
      );
    });

    it("should throw error when comment creation fails", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: "Forbidden" }),
        data: { message: "Forbidden" },
      });
      global.fetch = mockFetch as any;

      await expect(
        provider.createComment("test-owner/test-repo", "123", "Test comment"),
      ).rejects.toThrow(
        "Failed to create comment on test-owner/test-repo#123: 403 Forbidden",
      );
    });

    it("should throw error for invalid repository format", async () => {
      await expect(
        provider.createComment("invalid-repo", "123", "Test comment"),
      ).rejects.toThrow("Invalid repository format: invalid-repo");
    });
  });

  describe("updateComment", () => {
    it("should update comment using Forgejo API", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 456 }),
      });
      global.fetch = mockFetch as any;

      await provider.updateComment(
        "test-owner/test-repo",
        "456",
        "Updated comment",
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://forgejo.example.com/api/v1/repos/test-owner/test-repo/issues/comments/456",
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            Authorization: "token test-token",
          }),
          body: JSON.stringify({ body: "Updated comment" }),
        }),
      );
    });

    it("should throw error when comment update fails", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: "Not found" }),
        data: { message: "Not found" },
      });
      global.fetch = mockFetch as any;

      await expect(
        provider.updateComment(
          "test-owner/test-repo",
          "456",
          "Updated comment",
        ),
      ).rejects.toThrow(
        "Failed to update comment 456 on test-owner/test-repo: 404 Not found",
      );
    });

    it("should throw error for invalid repository format", async () => {
      await expect(
        provider.updateComment("invalid-repo", "456", "Updated comment"),
      ).rejects.toThrow("Invalid repository format: invalid-repo");
    });
  });
});
