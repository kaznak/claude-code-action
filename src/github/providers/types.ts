// Common types for Git forge providers
export type ForgeAuthor = {
  login: string;
  name?: string;
};

export type ForgeComment = {
  id: string;
  databaseId: string;
  body: string;
  author: ForgeAuthor;
  createdAt: string;
};

export type ForgeReviewComment = ForgeComment & {
  path: string;
  line: number | null;
};

export type ForgeCommit = {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
};

export type ForgeFile = {
  path: string;
  additions: number;
  deletions: number;
  changeType: string;
};

export type ForgeFileWithSHA = ForgeFile & {
  sha: string;
};

export type ForgeReview = {
  id: string;
  databaseId: string;
  author: ForgeAuthor;
  body: string;
  state: string;
  submittedAt: string;
  comments: {
    nodes: ForgeReviewComment[];
  };
};

export type ForgePullRequest = {
  title: string;
  body: string;
  author: ForgeAuthor;
  baseRefName: string;
  headRefName: string;
  headRefOid: string;
  createdAt: string;
  additions: number;
  deletions: number;
  state: string;
  commits: {
    totalCount: number;
    nodes: Array<{
      commit: ForgeCommit;
    }>;
  };
  files: {
    nodes: ForgeFile[];
  };
  comments: {
    nodes: ForgeComment[];
  };
  reviews: {
    nodes: ForgeReview[];
  };
};

export type ForgeIssue = {
  title: string;
  body: string;
  author: ForgeAuthor;
  createdAt: string;
  state: string;
  comments: {
    nodes: ForgeComment[];
  };
};

export type FetchDataResult = {
  contextData: ForgePullRequest | ForgeIssue;
  comments: ForgeComment[];
  changedFiles: ForgeFile[];
  changedFilesWithSHA: ForgeFileWithSHA[];
  reviewData: { nodes: ForgeReview[] } | null;
  imageUrlMap: Map<string, string>;
  triggerDisplayName?: string | null;
};

export type FetchDataParams = {
  repository: string;
  prNumber: string;
  isPR: boolean;
  triggerUsername?: string;
};