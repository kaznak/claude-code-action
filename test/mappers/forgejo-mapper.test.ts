import { describe, it, expect } from "bun:test";
import {
  mapForgejoUser,
  mapForgejoComment,
  mapForgejoCommit,
  mapForgejoFile,
  mapForgejoPullRequest,
  mapForgejoIssue,
  mapForgejoReview,
  mapForgejoReviewComment,
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

  describe("mapForgejoReview", () => {
    it("should map Forgejo review to ForgeReview", () => {
      const forgejoReview = {
        id: 1,
        user: { id: 1, login: "reviewer", full_name: "Reviewer User" },
        body: "This looks good!",
        state: "APPROVED",
        submitted_at: "2023-01-01T00:00:00Z",
      };

      const reviewComments = [
        {
          id: 1,
          user: { id: 1, login: "reviewer", full_name: "Reviewer User" },
          body: "Nice work here",
          path: "src/test.js",
          line: 10,
          created_at: "2023-01-01T00:00:00Z",
        },
      ];

      const result = mapForgejoReview(forgejoReview, reviewComments);

      expect(result).toEqual({
        id: "1",
        databaseId: "1",
        author: { login: "reviewer", name: "Reviewer User" },
        body: "This looks good!",
        state: "approved",
        submittedAt: "2023-01-01T00:00:00Z",
        comments: {
          nodes: [
            {
              id: "1",
              databaseId: "1",
              body: "Nice work here",
              author: { login: "reviewer", name: "Reviewer User" },
              createdAt: "2023-01-01T00:00:00Z",
              path: "src/test.js",
              line: 10,
            },
          ],
        },
      });
    });

    it("should handle review without comments", () => {
      const forgejoReview = {
        id: 2,
        user: { id: 2, login: "reviewer2", full_name: "Another Reviewer" },
        body: "Needs changes",
        state: "CHANGES_REQUESTED",
        submitted_at: "2023-01-02T00:00:00Z",
      };

      const result = mapForgejoReview(forgejoReview);

      expect(result).toEqual({
        id: "2",
        databaseId: "2",
        author: { login: "reviewer2", name: "Another Reviewer" },
        body: "Needs changes",
        state: "changes_requested",
        submittedAt: "2023-01-02T00:00:00Z",
        comments: {
          nodes: [],
        },
      });
    });
  });

  describe("mapForgejoReviewComment", () => {
    it("should map Forgejo review comment to ForgeReviewComment", () => {
      const forgejoReviewComment = {
        id: 1,
        user: { id: 1, login: "reviewer", full_name: "Reviewer User" },
        body: "This needs improvement",
        path: "src/main.js",
        line: 25,
        original_line: 20,
        created_at: "2023-01-01T00:00:00Z",
      };

      const result = mapForgejoReviewComment(forgejoReviewComment);

      expect(result).toEqual({
        id: "1",
        databaseId: "1",
        body: "This needs improvement",
        author: { login: "reviewer", name: "Reviewer User" },
        createdAt: "2023-01-01T00:00:00Z",
        path: "src/main.js",
        line: 25,
      });
    });

    it("should handle review comment without line number", () => {
      const forgejoReviewComment = {
        id: 2,
        user: { id: 2, login: "reviewer2" },
        body: "General comment",
        path: "src/utils.js",
        created_at: "2023-01-02T00:00:00Z",
      };

      const result = mapForgejoReviewComment(forgejoReviewComment);

      expect(result).toEqual({
        id: "2",
        databaseId: "2",
        body: "General comment",
        author: { login: "reviewer2", name: "reviewer2" },
        createdAt: "2023-01-02T00:00:00Z",
        path: "src/utils.js",
        line: null,
      });
    });

    it("should use original_line when line is not available", () => {
      const forgejoReviewComment = {
        id: 3,
        user: { id: 3, login: "reviewer3", full_name: "Third Reviewer" },
        body: "Old line comment",
        path: "src/old.js",
        original_line: 15,
        created_at: "2023-01-03T00:00:00Z",
      };

      const result = mapForgejoReviewComment(forgejoReviewComment);

      expect(result).toEqual({
        id: "3",
        databaseId: "3",
        body: "Old line comment",
        author: { login: "reviewer3", name: "Third Reviewer" },
        createdAt: "2023-01-03T00:00:00Z",
        path: "src/old.js",
        line: 15,
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

    it("should handle PR with reviews and review comments", () => {
      const forgejoPR: ForgejoPullRequest = {
        id: 2,
        number: 456,
        title: "PR with Reviews",
        body: "PR with review comments",
        user: { id: 1, login: "author", full_name: "Author User" },
        state: "open",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T01:00:00Z",
        base: {
          ref: "main",
          sha: "base456",
          repo: {
            name: "test-repo",
            owner: { id: 1, login: "testorg" },
          },
        },
        head: {
          ref: "feature-branch",
          sha: "head789",
          repo: {
            name: "test-repo",
            owner: { id: 1, login: "author" },
          },
        },
        additions: 15,
        deletions: 3,
      };

      const reviews = [
        {
          id: 1,
          user: { id: 2, login: "reviewer", full_name: "Reviewer User" },
          body: "Looks good overall",
          state: "APPROVED",
          submitted_at: "2023-01-01T02:00:00Z",
        },
        {
          id: 2,
          user: { id: 3, login: "reviewer2", full_name: "Second Reviewer" },
          body: "Some issues found",
          state: "CHANGES_REQUESTED",
          submitted_at: "2023-01-01T03:00:00Z",
        },
      ];

      const reviewComments = [
        {
          id: 1,
          user: { id: 2, login: "reviewer", full_name: "Reviewer User" },
          body: "This could be improved",
          path: "src/main.js",
          line: 10,
          created_at: "2023-01-01T02:30:00Z",
        },
        {
          id: 2,
          user: { id: 3, login: "reviewer2", full_name: "Second Reviewer" },
          body: "Consider using a different approach",
          path: "src/utils.js",
          line: 25,
          created_at: "2023-01-01T03:30:00Z",
        },
      ];

      const result = mapForgejoPullRequest(
        forgejoPR,
        [],
        [],
        [],
        reviews,
        reviewComments,
      );

      expect(result.title).toBe("PR with Reviews");
      expect(result.reviews.nodes).toHaveLength(2);
      expect(result.reviews.nodes[0]?.author.login).toBe("reviewer");
      expect(result.reviews.nodes[0]?.state).toBe("approved");
      expect(result.reviews.nodes[0]?.comments.nodes).toHaveLength(2);
      expect(result.reviews.nodes[1]?.author.login).toBe("reviewer2");
      expect(result.reviews.nodes[1]?.state).toBe("changes_requested");
    });

    it("should handle PR with orphaned review comments", () => {
      const forgejoPR: ForgejoPullRequest = {
        id: 3,
        number: 789,
        title: "PR with Orphaned Comments",
        body: "PR body",
        user: { id: 1, login: "author", full_name: "Author User" },
        state: "open",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T01:00:00Z",
        base: {
          ref: "main",
          sha: "base789",
          repo: {
            name: "test-repo",
            owner: { id: 1, login: "testorg" },
          },
        },
        head: {
          ref: "feature-branch",
          sha: "head012",
          repo: {
            name: "test-repo",
            owner: { id: 1, login: "author" },
          },
        },
      };

      const reviews = [
        {
          id: 1,
          user: { id: 2, login: "reviewer", full_name: "Reviewer User" },
          body: "Review body",
          state: "COMMENTED",
          submitted_at: "2023-01-01T02:00:00Z",
        },
      ];

      const orphanedReviewComments = [
        {
          id: 1,
          user: { id: 3, login: "commenter", full_name: "Comment User" },
          body: "Orphaned comment",
          path: "src/orphan.js",
          line: 5,
          created_at: "2023-01-01T03:00:00Z",
        },
      ];

      const result = mapForgejoPullRequest(
        forgejoPR,
        [],
        [],
        [],
        reviews,
        orphanedReviewComments,
      );

      expect(result.reviews.nodes).toHaveLength(1);
      expect(result.reviews.nodes[0]?.comments.nodes).toHaveLength(1);
      expect(result.reviews.nodes[0]?.comments.nodes[0]?.body).toBe(
        "Orphaned comment",
      );
    });

    it("should handle PR with no reviews but with review comments", () => {
      const forgejoPR: ForgejoPullRequest = {
        id: 4,
        number: 101,
        title: "PR with No Reviews",
        body: "PR body",
        user: { id: 1, login: "author", full_name: "Author User" },
        state: "open",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T01:00:00Z",
        base: {
          ref: "main",
          sha: "base101",
          repo: {
            name: "test-repo",
            owner: { id: 1, login: "testorg" },
          },
        },
        head: {
          ref: "feature-branch",
          sha: "head101",
          repo: {
            name: "test-repo",
            owner: { id: 1, login: "author" },
          },
        },
      };

      const reviewComments = [
        {
          id: 1,
          user: { id: 2, login: "commenter", full_name: "Comment User" },
          body: "Standalone comment",
          path: "src/standalone.js",
          line: 1,
          created_at: "2023-01-01T02:00:00Z",
        },
      ];

      const result = mapForgejoPullRequest(
        forgejoPR,
        [],
        [],
        [],
        [],
        reviewComments,
      );

      expect(result.reviews.nodes).toHaveLength(0);
    });

    it("should handle missing optional fields", () => {
      const forgejoPR: ForgejoPullRequest = {
        id: 5,
        number: 202,
        title: "Minimal PR",
        body: "Minimal PR body",
        user: { id: 1, login: "author" },
        state: "open",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T01:00:00Z",
        base: {
          ref: "main",
          sha: "base202",
          repo: {
            name: "test-repo",
            owner: { id: 1, login: "testorg" },
          },
        },
        head: {
          ref: "feature-branch",
          sha: "head202",
          repo: {
            name: "test-repo",
            owner: { id: 1, login: "author" },
          },
        },
      };

      const result = mapForgejoPullRequest(forgejoPR);

      expect(result.title).toBe("Minimal PR");
      expect(result.author.name).toBe("author");
      expect(result.additions).toBe(0);
      expect(result.deletions).toBe(0);
      expect(result.commits.nodes).toHaveLength(0);
      expect(result.files.nodes).toHaveLength(0);
      expect(result.comments.nodes).toHaveLength(0);
      expect(result.reviews.nodes).toHaveLength(0);
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
