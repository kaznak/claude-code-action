import { describe, it, expect } from "bun:test";
import {
  mapForgejoUser,
  mapForgejoComment,
  mapForgejoCommit,
  mapForgejoFile,
  mapForgejoPullRequest,
  mapForgejoIssue,
  type ForgejoUser,
  type ForgejoComment,
  type ForgejoCommit,
  type ForgejoFile,
  type ForgejoPullRequest,
  type ForgejoIssue,
} from "../../src/github/mappers/forgejo";

describe("Forgejo Data Mappers", () => {
  describe("mapForgejoUser", () => {
    it("should map Forgejo user to ForgeAuthor", () => {
      const forgejoUser: ForgejoUser = {
        id: 123,
        login: "testuser",
        full_name: "Test User",
        email: "test@example.com",
      };

      const result = mapForgejoUser(forgejoUser);

      expect(result).toEqual({
        login: "testuser",
        name: "Test User",
      });
    });

    it("should fallback to login when full_name is not available", () => {
      const forgejoUser: ForgejoUser = {
        id: 123,
        login: "testuser",
      };

      const result = mapForgejoUser(forgejoUser);

      expect(result).toEqual({
        login: "testuser",
        name: "testuser",
      });
    });
  });

  describe("mapForgejoComment", () => {
    it("should map Forgejo comment to ForgeComment", () => {
      const forgejoComment: ForgejoComment = {
        id: 456,
        user: { id: 123, login: "testuser", full_name: "Test User" },
        body: "Test comment body",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T01:00:00Z",
      };

      const result = mapForgejoComment(forgejoComment);

      expect(result).toEqual({
        id: "456",
        databaseId: "456",
        body: "Test comment body",
        author: { login: "testuser", name: "Test User" },
        createdAt: "2023-01-01T00:00:00Z",
      });
    });
  });

  describe("mapForgejoCommit", () => {
    it("should map Forgejo commit to ForgeCommit", () => {
      const forgejoCommit: ForgejoCommit = {
        sha: "abc123",
        commit: {
          message: "Test commit message",
          author: {
            name: "Test Author",
            email: "author@example.com",
          },
        },
      };

      const result = mapForgejoCommit(forgejoCommit);

      expect(result).toEqual({
        oid: "abc123",
        message: "Test commit message",
        author: {
          name: "Test Author",
          email: "author@example.com",
        },
      });
    });
  });

  describe("mapForgejoFile", () => {
    it("should map Forgejo file to ForgeFile", () => {
      const forgejoFile: ForgejoFile = {
        filename: "src/test.js",
        additions: 10,
        deletions: 5,
        changes: 15,
        status: "modified",
      };

      const result = mapForgejoFile(forgejoFile);

      expect(result).toEqual({
        path: "src/test.js",
        additions: 10,
        deletions: 5,
        changeType: "modified",
      });
    });
  });

  describe("mapForgejoPullRequest", () => {
    it("should map Forgejo pull request to ForgePullRequest", () => {
      const forgejoPR: ForgejoPullRequest = {
        id: 1,
        number: 123,
        title: "Test PR",
        body: "Test PR body",
        user: { id: 456, login: "testuser", full_name: "Test User" },
        state: "open",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T01:00:00Z",
        base: {
          ref: "main",
          sha: "base123",
          repo: {
            name: "test-repo",
            owner: { id: 789, login: "testorg" },
          },
        },
        head: {
          ref: "feature",
          sha: "head456",
          repo: {
            name: "test-repo",
            owner: { id: 456, login: "testuser" },
          },
        },
        additions: 20,
        deletions: 10,
      };

      const commits: ForgejoCommit[] = [
        {
          sha: "commit1",
          commit: {
            message: "Test commit",
            author: { name: "Test Author", email: "author@example.com" },
          },
        },
      ];

      const files: ForgejoFile[] = [
        {
          filename: "test.js",
          additions: 10,
          deletions: 5,
          changes: 15,
          status: "modified",
        },
      ];

      const comments: ForgejoComment[] = [
        {
          id: 1,
          user: { id: 456, login: "testuser", full_name: "Test User" },
          body: "Test comment",
          created_at: "2023-01-01T02:00:00Z",
          updated_at: "2023-01-01T02:00:00Z",
        },
      ];

      const result = mapForgejoPullRequest(forgejoPR, commits, files, comments);

      expect(result.title).toBe("Test PR");
      expect(result.body).toBe("Test PR body");
      expect(result.author.login).toBe("testuser");
      expect(result.baseRefName).toBe("main");
      expect(result.headRefName).toBe("feature");
      expect(result.headRefOid).toBe("head456");
      expect(result.additions).toBe(20);
      expect(result.deletions).toBe(10);
      expect(result.state).toBe("open");
      expect(result.commits.totalCount).toBe(1);
      expect(result.commits.nodes[0]?.commit.oid).toBe("commit1");
      expect(result.files.nodes).toHaveLength(1);
      expect(result.files.nodes[0]?.path).toBe("test.js");
      expect(result.comments.nodes).toHaveLength(1);
      expect(result.comments.nodes[0]?.body).toBe("Test comment");
    });
  });

  describe("mapForgejoIssue", () => {
    it("should map Forgejo issue to ForgeIssue", () => {
      const forgejoIssue: ForgejoIssue = {
        id: 1,
        number: 123,
        title: "Test Issue",
        body: "Test issue body",
        user: { id: 456, login: "testuser", full_name: "Test User" },
        state: "open",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T01:00:00Z",
      };

      const comments: ForgejoComment[] = [
        {
          id: 1,
          user: { id: 456, login: "testuser", full_name: "Test User" },
          body: "Test comment",
          created_at: "2023-01-01T02:00:00Z",
          updated_at: "2023-01-01T02:00:00Z",
        },
      ];

      const result = mapForgejoIssue(forgejoIssue, comments);

      expect(result.title).toBe("Test Issue");
      expect(result.body).toBe("Test issue body");
      expect(result.author.login).toBe("testuser");
      expect(result.state).toBe("open");
      expect(result.comments.nodes).toHaveLength(1);
      expect(result.comments.nodes[0]?.body).toBe("Test comment");
    });
  });
});
