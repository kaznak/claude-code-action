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
    it("should throw not implemented error for now", async () => {
      const params: FetchDataParams = {
        repository: "test-owner/test-repo",
        prNumber: "123",
        isPR: true,
      };

      await expect(provider.fetchData(params)).rejects.toThrow(
        "Forgejo provider not yet implemented. Coming in Phase 2.",
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
