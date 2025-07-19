# Forgejo Support Implementation

## Overview

This document outlines the completed implementation of Forgejo support for claude-code-action. Forgejo is a self-hosted Git forge that provides a GitHub-compatible REST API. This implementation adds full Forgejo support through a provider abstraction pattern while maintaining backward compatibility with GitHub.

## ✅ Implementation Status: COMPLETED

All phases have been successfully implemented and tested:

- ✅ Phase 1: Provider abstraction and basic Forgejo implementation
- ✅ Phase 2: Complete REST API integration and data mappers
- ✅ Phase 3: Comprehensive testing and documentation

## 🎯 Implementation Summary

### Key Features Implemented

1. **Provider Abstraction Pattern**

   - `GitForgeProvider` interface for platform independence
   - Factory pattern for provider instantiation
   - Environment-based provider selection

2. **Full Forgejo REST API Integration**

   - Complete PR and Issue data fetching
   - Comment creation and updates
   - User display name resolution
   - File change tracking
   - Review system support (when available)

3. **Data Compatibility Layer**

   - Unified data structures for GitHub and Forgejo
   - Automatic data mapping between platforms
   - Graceful handling of API differences

4. **Comprehensive Testing**

   - Unit tests for all providers and mappers
   - Integration tests for real API interactions
   - Cross-platform compatibility validation
   - CI/CD workflows for automated testing

5. **Documentation and Examples**
   - Setup guides and configuration examples
   - Multiple workflow templates
   - Public instance support (Codeberg)

### Quick Start

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    forge_type: forgejo
    forge_api_url: https://your-forgejo.com/api/v1
    forge_server_url: https://your-forgejo.com
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.FORGEJO_TOKEN }}
```

## Current State Analysis

### Dependencies on GitHub-Specific Features

The current implementation heavily relies on GitHub's GraphQL API for data fetching:

1. **GraphQL Queries** (`src/github/api/queries/github.ts`)

   - `PR_QUERY`: Fetches pull request data, commits, files, comments, and reviews
   - `ISSUE_QUERY`: Fetches issue data and comments
   - `USER_QUERY`: Fetches user display names

2. **Data Fetcher** (`src/github/data/fetcher.ts`)

   - Uses GraphQL to fetch comprehensive PR/issue data
   - Relies on GitHub's nested data structure

3. **API Configuration** (`src/github/api/config.ts`)
   - Hardcoded to GitHub API endpoints
   - Uses GitHub-specific authentication patterns

## Forgejo API Analysis

### Key Findings

1. **API Type**: Forgejo provides a REST API only (no GraphQL support)
2. **API Base URL**: `https://forgejo.your.host/api/v1/` (configurable per instance)
3. **Authentication**: Compatible with GitHub's token-based authentication
4. **Webhooks**: Supports GitHub-compatible webhook events and headers
5. **API Compatibility**: Maintains compatibility with Gitea's REST API

### API Endpoints Available

```
GET /api/v1/repos/{owner}/{repo}/issues
GET /api/v1/repos/{owner}/{repo}/pulls
GET /api/v1/repos/{owner}/{repo}/commits
GET /api/v1/repos/{owner}/{repo}/comments
GET /api/v1/users/{username}
POST /api/v1/repos/{owner}/{repo}/issues/{index}/comments
```

### Missing Features

1. **GraphQL API**: Not available in Forgejo
2. **Some GitHub-specific endpoints**: May have different response structures

## Implementation Strategy

### Option 1: Provider Abstraction (Recommended)

Create a provider abstraction layer that allows switching between GitHub and Forgejo:

```typescript
interface GitForgeProvider {
  fetchPullRequest(repo: string, number: number): Promise<PullRequestData>;
  fetchIssue(repo: string, number: number): Promise<IssueData>;
  fetchComments(repo: string, number: number): Promise<CommentData[]>;
  fetchUser(username: string): Promise<UserData>;
  createComment(repo: string, number: number, body: string): Promise<void>;
}

class GitHubProvider implements GitForgeProvider {
  // Current GraphQL-based implementation
}

class ForgejoProvider implements GitForgeProvider {
  // New REST API-based implementation
}
```

### Option 2: Unified REST API Approach

Convert the entire codebase to use REST APIs for both GitHub and Forgejo:

- GitHub REST API is well-documented and feature-complete
- Eliminates GraphQL dependency entirely
- Provides better compatibility across different Git forges

## Required Changes

### 1. High Priority - API Layer Refactoring

#### Create Provider Factory

```typescript
// src/github/providers/factory.ts
export function createProvider(
  type: "github" | "forgejo",
  config: ProviderConfig,
): GitForgeProvider {
  switch (type) {
    case "github":
      return new GitHubProvider(config);
    case "forgejo":
      return new ForgejoProvider(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
```

#### Update Configuration

```typescript
// src/github/api/config.ts
export const FORGE_TYPE = process.env.FORGE_TYPE || "github";
export const FORGE_API_URL =
  process.env.FORGE_API_URL || "https://api.github.com";
export const FORGE_SERVER_URL =
  process.env.FORGE_SERVER_URL || "https://github.com";
```

#### Convert GraphQL to REST

Replace GraphQL queries with REST API calls:

```typescript
// Before (GraphQL)
const prResult = await octokits.graphql<PullRequestQueryResponse>(PR_QUERY, {
  owner,
  repo,
  number: parseInt(prNumber),
});

// After (REST)
const prData = await octokits.rest.pulls.get({
  owner,
  repo,
  pull_number: parseInt(prNumber),
});
const commits = await octokits.rest.pulls.listCommits({
  owner,
  repo,
  pull_number: parseInt(prNumber),
});
const files = await octokits.rest.pulls.listFiles({
  owner,
  repo,
  pull_number: parseInt(prNumber),
});
```

### 2. Medium Priority - Data Structure Harmonization

#### Create Common Data Models

```typescript
// src/github/types/common.ts
export interface UnifiedPullRequest {
  title: string;
  body: string;
  author: UnifiedAuthor;
  baseRefName: string;
  headRefName: string;
  commits: UnifiedCommit[];
  files: UnifiedFile[];
  comments: UnifiedComment[];
  reviews: UnifiedReview[];
}
```

#### Implement Data Mappers

```typescript
// src/github/mappers/github.ts
export function mapGitHubPullRequest(
  data: GitHub.PullRequest,
): UnifiedPullRequest {
  // Convert GitHub REST API response to unified format
}

// src/github/mappers/forgejo.ts
export function mapForgejoPullRequest(
  data: Forgejo.PullRequest,
): UnifiedPullRequest {
  // Convert Forgejo REST API response to unified format
}
```

### 3. Low Priority - Action Configuration

#### Update Action Inputs

```yaml
# action.yml
inputs:
  forge_type:
    description: "Git forge type (github or forgejo)"
    required: false
    default: "github"
  forge_api_url:
    description: "Git forge API URL (for self-hosted instances)"
    required: false
  forge_server_url:
    description: "Git forge server URL (for self-hosted instances)"
    required: false
```

#### Environment Variables

```bash
FORGE_TYPE=forgejo
FORGE_API_URL=https://forgejo.example.com/api/v1
FORGE_SERVER_URL=https://forgejo.example.com
```

## Implementation Phases

### Phase 1: Foundation (2-3 weeks)

1. Create provider abstraction interfaces
2. Implement basic Forgejo provider with REST API
3. Add configuration options for forge type and URLs
4. Update action.yml with new inputs

### Phase 2: Core Features (3-4 weeks)

1. Convert all GraphQL queries to REST API calls
2. Implement data mappers for both GitHub and Forgejo
3. Update data fetcher to use provider abstraction
4. Add comprehensive error handling

### Phase 3: Testing & Polish (1-2 weeks)

1. Create unit tests for Forgejo provider
2. Add integration tests with Forgejo instances
3. Update documentation and examples
4. Add GitHub Actions workflow for Forgejo testing

## Migration Strategy

### Backward Compatibility

- Maintain existing GitHub functionality unchanged
- Default to GitHub provider when no forge type is specified
- Ensure all existing workflows continue to work

### Rollout Plan

1. **Alpha**: Internal testing with basic Forgejo functionality
2. **Beta**: Limited release to select users for feedback
3. **GA**: Full release with comprehensive documentation

## Testing Strategy

### Unit Tests

- Provider implementations
- Data mappers
- Configuration handling

### Integration Tests

- GitHub API compatibility
- Forgejo API compatibility
- Webhook handling
- Authentication flows

### E2E Tests

- Complete workflow execution on both platforms
- Error handling and edge cases
- Performance benchmarks

## Documentation Updates

### User-Facing Documentation

- README.md: Add Forgejo configuration examples
- New guide: "Using with Forgejo"
- FAQ: Common Forgejo setup questions

### Developer Documentation

- Architecture overview with provider pattern
- API mapping documentation
- Contributing guidelines for new providers

## Risk Assessment

### Technical Risks

- **API differences**: Forgejo API might have subtle differences from GitHub
- **Performance**: Multiple REST calls vs single GraphQL query
- **Maintenance**: Supporting multiple providers increases complexity

### Mitigation Strategies

- Comprehensive testing suite
- Clear provider interface contracts
- Gradual rollout with feedback collection
- Detailed error reporting and logging

## Success Metrics

- Successful PR/issue handling on Forgejo instances
- No regression in GitHub functionality
- Positive user feedback from Forgejo community
- Maintainable codebase with clear separation of concerns

## Future Considerations

### Additional Git Forges

The provider pattern enables support for other Git forges:

- GitLab
- Gitea
- Codeberg
- Custom implementations

### Enhanced Features

- Forgejo Actions integration
- Advanced webhook handling
- Custom authentication methods
- Instance-specific optimizations
