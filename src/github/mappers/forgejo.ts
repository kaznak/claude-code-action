import type {
  ForgeAuthor,
  ForgeComment,
  ForgePullRequest,
  ForgeIssue,
  ForgeCommit,
  ForgeFile,
  ForgeReview,
  ForgeReviewComment,
} from "../providers/types";

// Forgejo API response types
export interface ForgejoUser {
  id: number;
  login: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface ForgejoPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  user: ForgejoUser;
  state: string;
  created_at: string;
  updated_at: string;
  base: {
    ref: string;
    sha: string;
    repo: {
      name: string;
      owner: ForgejoUser;
    };
  };
  head: {
    ref: string;
    sha: string;
    repo: {
      name: string;
      owner: ForgejoUser;
    };
  };
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface ForgejoIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  user: ForgejoUser;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface ForgejoComment {
  id: number;
  user: ForgejoUser;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ForgejoCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
    };
  };
}

export interface ForgejoFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
  sha?: string;
}

export interface ForgejoReview {
  id: number;
  user: ForgejoUser;
  body: string;
  state: string;
  submitted_at: string;
}

export interface ForgejoReviewComment {
  id: number;
  user: ForgejoUser;
  body: string;
  path: string;
  line?: number;
  original_line?: number;
  created_at: string;
}

/**
 * Convert Forgejo user to ForgeAuthor
 */
export function mapForgejoUser(user: ForgejoUser): ForgeAuthor {
  return {
    login: user.login,
    name: user.full_name || user.login,
  };
}

/**
 * Convert Forgejo comment to ForgeComment
 */
export function mapForgejoComment(comment: ForgejoComment): ForgeComment {
  return {
    id: comment.id.toString(),
    databaseId: comment.id.toString(),
    body: comment.body,
    author: mapForgejoUser(comment.user),
    createdAt: comment.created_at,
  };
}

/**
 * Convert Forgejo review comment to ForgeReviewComment
 */
export function mapForgejoReviewComment(
  comment: ForgejoReviewComment,
): ForgeReviewComment {
  return {
    id: comment.id.toString(),
    databaseId: comment.id.toString(),
    body: comment.body,
    author: mapForgejoUser(comment.user),
    createdAt: comment.created_at,
    path: comment.path,
    line: comment.line || comment.original_line || null,
  };
}

/**
 * Convert Forgejo commit to ForgeCommit
 */
export function mapForgejoCommit(commit: ForgejoCommit): ForgeCommit {
  return {
    oid: commit.sha,
    message: commit.commit.message,
    author: {
      name: commit.commit.author.name,
      email: commit.commit.author.email,
    },
  };
}

/**
 * Convert Forgejo file to ForgeFile
 */
export function mapForgejoFile(file: ForgejoFile): ForgeFile {
  return {
    path: file.filename,
    additions: file.additions,
    deletions: file.deletions,
    changeType: file.status,
  };
}

/**
 * Convert Forgejo review to ForgeReview
 */
export function mapForgejoReview(
  review: ForgejoReview,
  reviewComments: ForgejoReviewComment[] = [],
): ForgeReview {
  return {
    id: review.id.toString(),
    databaseId: review.id.toString(),
    author: mapForgejoUser(review.user),
    body: review.body,
    state: review.state.toLowerCase(),
    submittedAt: review.submitted_at,
    comments: {
      nodes: reviewComments.map(mapForgejoReviewComment),
    },
  };
}

/**
 * Convert Forgejo pull request to ForgePullRequest
 */
export function mapForgejoPullRequest(
  pr: ForgejoPullRequest,
  commits: ForgejoCommit[] = [],
  files: ForgejoFile[] = [],
  comments: ForgejoComment[] = [],
  reviews: ForgejoReview[] = [],
  reviewComments: ForgejoReviewComment[] = [],
): ForgePullRequest {
  // Group review comments by review ID
  const reviewCommentsMap = new Map<number, ForgejoReviewComment[]>();
  reviewComments.forEach((comment) => {
    // If comment doesn't have a review ID, we'll assign to the first review
    const reviewId = reviews.length > 0 ? reviews[0]!.id : 0;
    if (!reviewCommentsMap.has(reviewId)) {
      reviewCommentsMap.set(reviewId, []);
    }
    reviewCommentsMap.get(reviewId)?.push(comment);
  });

  return {
    title: pr.title,
    body: pr.body,
    author: mapForgejoUser(pr.user),
    baseRefName: pr.base.ref,
    headRefName: pr.head.ref,
    headRefOid: pr.head.sha,
    createdAt: pr.created_at,
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
    state: pr.state.toLowerCase(),
    commits: {
      totalCount: commits.length,
      nodes: commits.map((commit) => ({
        commit: mapForgejoCommit(commit),
      })),
    },
    files: {
      nodes: files.map(mapForgejoFile),
    },
    comments: {
      nodes: comments.map(mapForgejoComment),
    },
    reviews: {
      nodes: reviews.map((review) =>
        mapForgejoReview(review, reviewCommentsMap.get(review.id) || []),
      ),
    },
  };
}

/**
 * Convert Forgejo issue to ForgeIssue
 */
export function mapForgejoIssue(
  issue: ForgejoIssue,
  comments: ForgejoComment[] = [],
): ForgeIssue {
  return {
    title: issue.title,
    body: issue.body,
    author: mapForgejoUser(issue.user),
    createdAt: issue.created_at,
    state: issue.state.toLowerCase(),
    comments: {
      nodes: comments.map(mapForgejoComment),
    },
  };
}
