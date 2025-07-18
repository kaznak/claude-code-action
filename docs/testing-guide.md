# Testing Guide for Forgejo Support

## Overview

This guide explains how to test the Git forge abstraction layer implementation.

## Test Structure

```
test/
├── providers/
│   ├── provider-interface.test.ts  # Interface contract tests
│   ├── factory.test.ts            # Factory and configuration tests
│   ├── github-provider.test.ts    # GitHub provider implementation tests
│   └── forgejo-provider.test.ts   # Forgejo provider implementation tests (Phase 2)
└── integration/
    └── forge-integration.test.ts  # End-to-end tests (Phase 3)
```

## Running Tests

### Run All Tests
```bash
bun test
```

### Run Provider Tests Only
```bash
bun test test/providers/
```

### Run Specific Test File
```bash
bun test test/providers/factory.test.ts
```

### Watch Mode
```bash
bun test --watch
```

## Testing Strategies

### 1. Unit Tests

#### Provider Interface Tests
- Verify all providers implement the required interface
- Test method signatures and return types
- Use mock implementations for testing

#### Factory Tests
- Test provider creation with different configurations
- Test environment variable handling
- Test error cases (missing tokens, invalid types)

#### Provider Implementation Tests
- Mock external dependencies (API calls)
- Test data transformation logic
- Test error handling

### 2. Integration Tests (Phase 2)

#### Mock API Server
```typescript
// test/mocks/forgejo-api-server.ts
import { serve } from "bun";

export function createMockForgejoServer() {
  return serve({
    port: 3000,
    fetch(req) {
      const url = new URL(req.url);
      
      // Mock API endpoints
      if (url.pathname === "/api/v1/repos/owner/repo/issues/123") {
        return Response.json({
          title: "Test Issue",
          body: "Test body",
          user: { login: "test-user" },
          // ... other fields
        });
      }
      
      return new Response("Not found", { status: 404 });
    },
  });
}
```

#### Integration Test Example
```typescript
test("fetches Forgejo issue data", async () => {
  const server = createMockForgejoServer();
  
  process.env.FORGE_TYPE = "forgejo";
  process.env.FORGE_API_URL = "http://localhost:3000/api/v1";
  
  const provider = createGitForgeProviderFromEnv();
  const result = await provider.fetchData({
    repository: "owner/repo",
    prNumber: "123",
    isPR: false,
  });
  
  expect(result.contextData.title).toBe("Test Issue");
  
  server.stop();
});
```

### 3. E2E Tests (Phase 3)

#### Using Docker
```yaml
# docker-compose.test.yml
version: '3'
services:
  forgejo:
    image: codeberg.org/forgejo/forgejo:latest
    ports:
      - "3000:3000"
    environment:
      - USER_UID=1000
      - USER_GID=1000
```

#### E2E Test Example
```typescript
test("complete workflow with real Forgejo instance", async () => {
  // Start Forgejo container
  // Create test repository
  // Create test issue/PR
  // Run the action
  // Verify results
});
```

## Mocking Strategies

### 1. API Response Mocks
```typescript
const mockPRResponse = {
  id: 1,
  number: 123,
  title: "Test PR",
  body: "Test body",
  user: { login: "test-user", name: "Test User" },
  base: { ref: "main" },
  head: { ref: "feature/test", sha: "abc123" },
  // ... other fields
};
```

### 2. Provider Mocks
```typescript
class MockForgejoProvider extends ForgejoProvider {
  constructor(private mockResponses: any) {
    super({ /* config */ });
  }
  
  async fetchData(params: FetchDataParams): Promise<FetchDataResult> {
    return this.mockResponses[params.prNumber] || super.fetchData(params);
  }
}
```

## Environment Variables for Testing

```bash
# .env.test
FORGE_TYPE=forgejo
FORGE_API_URL=http://localhost:3000/api/v1
FORGE_SERVER_URL=http://localhost:3000
GITHUB_TOKEN=test-token
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test Forgejo Support
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      forgejo:
        image: codeberg.org/forgejo/forgejo:latest
        ports:
          - 3000:3000
    
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test
      
  test-github-compatibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: FORGE_TYPE=github bun test
```

## Debugging Tests

### Enable Verbose Logging
```typescript
// In test files
process.env.DEBUG = "forgejo:*";
```

### Use Test Utilities
```typescript
// test/utils/test-helpers.ts
export function createTestProvider(overrides = {}) {
  return new MockGitForgeProvider({
    contextData: createTestPR(),
    comments: createTestComments(),
    ...overrides,
  });
}
```

## Test Coverage

### Check Coverage
```bash
bun test --coverage
```

### Coverage Targets
- Unit tests: 90%+ coverage
- Integration tests: 70%+ coverage
- E2E tests: Key workflows covered

## Common Issues and Solutions

### Issue: API Authentication Fails
```typescript
// Use mock tokens in tests
process.env.GITHUB_TOKEN = "test-token-12345";
```

### Issue: Network Requests in Tests
```typescript
// Mock all external requests
beforeEach(() => {
  global.fetch = mock((url) => {
    // Return mock responses
  });
});
```

### Issue: File System Operations
```typescript
// Use temporary directories
import { tmpdir } from "os";
import { mkdtempSync } from "fs";

const testDir = mkdtempSync(path.join(tmpdir(), "test-"));
```