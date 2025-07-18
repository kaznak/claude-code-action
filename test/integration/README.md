# Integration Tests

This directory contains integration tests for the claude-code-action, specifically focusing on testing the compatibility and functionality of different Git forge providers (GitHub and Forgejo).

## Test Types

### 1. Forgejo Integration Tests (`forgejo-integration.test.ts`)

Tests the Forgejo provider against real or mock Forgejo instances.

**Features:**

- Real API integration with Forgejo instances
- Performance testing
- Error handling validation
- Comment creation and management
- API timeout and network failure testing

### 2. Provider Compatibility Tests (`provider-compatibility.test.ts`)

Cross-provider tests ensuring both GitHub and Forgejo providers return compatible data structures.

**Features:**

- Data structure validation
- Error handling consistency
- Performance benchmarking
- Provider interface compliance

## Configuration

### Environment Variables

#### For Forgejo Testing:

```bash
# Required for Forgejo integration tests
FORGEJO_TEST_TOKEN=your_forgejo_personal_access_token
FORGEJO_TEST_API_URL=https://your-forgejo-instance.com/api/v1
FORGEJO_TEST_SERVER_URL=https://your-forgejo-instance.com

# Test data configuration
FORGEJO_TEST_REPO=owner/repository-name
FORGEJO_TEST_PR_NUMBER=1
FORGEJO_TEST_ISSUE_NUMBER=1
FORGEJO_TEST_USERNAME=test-user

# Optional: Skip write operations (comment creation/updates)
FORGEJO_TEST_SKIP_WRITE=true
```

#### For GitHub Testing:

```bash
# Standard GitHub token
GITHUB_TOKEN=your_github_personal_access_token

# Optional test data (defaults provided)
GITHUB_TEST_REPO=owner/repository-name
GITHUB_TEST_PR_NUMBER=1
GITHUB_TEST_ISSUE_NUMBER=1
GITHUB_TEST_USERNAME=test-user
```

## Running Tests

### Using npm/bun scripts:

```bash
# Run all Forgejo tests (unit + integration)
bun run test:forgejo

# Run only unit tests
bun run test:forgejo:unit

# Run only integration tests
bun run test:forgejo:integration
```

### Using the test script directly:

```bash
# Show help
./scripts/test-forgejo.sh --help

# Run all tests
./scripts/test-forgejo.sh

# Run unit tests only
./scripts/test-forgejo.sh --unit

# Run integration tests only
./scripts/test-forgejo.sh --integration

# Test against specific Forgejo instance
./scripts/test-forgejo.sh --forgejo-url https://codeberg.org --repo forgejo/forgejo

# Dry run to see what would be executed
./scripts/test-forgejo.sh --dry-run
```

### Using bun test directly:

```bash
# Run integration tests
bun test test/integration/

# Run specific integration test file
bun test test/integration/forgejo-integration.test.ts
bun test test/integration/provider-compatibility.test.ts
```

## Public Instance Testing

The tests can run against public Forgejo instances without authentication tokens for read-only operations:

### Codeberg (recommended for testing):

```bash
export FORGEJO_TEST_API_URL=https://codeberg.org/api/v1
export FORGEJO_TEST_SERVER_URL=https://codeberg.org
export FORGEJO_TEST_REPO=forgejo/forgejo
export FORGEJO_TEST_SKIP_WRITE=true

bun test test/integration/forgejo-integration.test.ts
```

### Self-hosted instances:

```bash
export FORGEJO_TEST_API_URL=https://your-instance.com/api/v1
export FORGEJO_TEST_SERVER_URL=https://your-instance.com
export FORGEJO_TEST_REPO=owner/repo
export FORGEJO_TEST_TOKEN=your_token  # For private repos or write operations

bun test test/integration/
```

## CI/CD Integration

The repository includes a GitHub Actions workflow (`.github/workflows/forgejo-integration.yml`) that:

1. Runs unit tests first
2. Tests against public Forgejo instances (Codeberg)
3. Optionally runs with provided tokens for full testing
4. Includes a Docker-based local Forgejo instance for testing

## Test Data Requirements

### For successful integration testing, you need:

1. **A test repository** with:

   - At least one pull request
   - At least one issue
   - Some comments (optional)
   - Public read access (or valid token)

2. **Valid user accounts** for testing user lookup functionality

3. **API access** to the Forgejo instance

## Troubleshooting

### Common Issues:

1. **"Authentication token is required"**

   - Set `FORGEJO_TEST_TOKEN` or `GITHUB_TOKEN`
   - Or use public repositories with `FORGEJO_TEST_SKIP_WRITE=true`

2. **"No such repository"**

   - Verify `FORGEJO_TEST_REPO` format: `owner/repo`
   - Check repository exists and is accessible

3. **"API endpoint not found"**

   - Verify `FORGEJO_TEST_API_URL` ends with `/api/v1`
   - Check Forgejo instance is running and accessible

4. **Network timeouts**
   - Check network connectivity to the Forgejo instance
   - Verify firewall/proxy settings

### Debug Mode:

Set `DEBUG=1` to enable verbose logging:

```bash
DEBUG=1 bun test test/integration/forgejo-integration.test.ts
```

## Contributing

When adding new integration tests:

1. **Follow the existing patterns** for environment variable usage
2. **Add proper error handling** for network failures
3. **Include both positive and negative test cases**
4. **Document any new environment variables** in this README
5. **Update the test script** if new test files are added
6. **Test against both public and private repositories** when possible

## Security Considerations

- **Never commit tokens** to the repository
- **Use read-only tokens** when possible
- **Set `FORGEJO_TEST_SKIP_WRITE=true`** for public instance testing
- **Be mindful of rate limits** when testing against public instances
- **Clean up test data** created during write operations
