#!/bin/bash

# Forgejo Integration Test Runner
# This script helps run Forgejo integration tests with different configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Forgejo Integration Test Runner${NC}"
echo "=================================="

# Function to print usage
print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --unit              Run unit tests only"
    echo "  -i, --integration       Run integration tests only"
    echo "  -a, --all              Run all tests (default)"
    echo "  --forgejo-url URL      Set Forgejo instance URL"
    echo "  --repo OWNER/REPO      Set test repository"
    echo "  --token TOKEN          Set access token"
    echo "  --dry-run             Show what would be run without executing"
    echo ""
    echo "Environment Variables:"
    echo "  FORGEJO_TEST_TOKEN            Personal access token"
    echo "  FORGEJO_TEST_API_URL          API URL (e.g., https://forgejo.example.com/api/v1)"
    echo "  FORGEJO_TEST_SERVER_URL       Server URL (e.g., https://forgejo.example.com)"
    echo "  FORGEJO_TEST_REPO             Test repository (e.g., test-org/test-repo)"
    echo "  FORGEJO_TEST_PR_NUMBER        Test PR number"
    echo "  FORGEJO_TEST_ISSUE_NUMBER     Test issue number"
    echo "  FORGEJO_TEST_SKIP_WRITE       Set to 'true' to skip write operations"
    echo ""
    echo "Examples:"
    echo "  $0 --unit                                    # Run unit tests only"
    echo "  $0 --forgejo-url https://codeberg.org       # Test against Codeberg"
    echo "  $0 --repo forgejo/forgejo --token \$TOKEN     # Test specific repo with auth"
}

# Default values
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_ALL=true
DRY_RUN=false
FORGEJO_URL=""
TEST_REPO=""
ACCESS_TOKEN=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        -u|--unit)
            RUN_UNIT=true
            RUN_ALL=false
            shift
            ;;
        -i|--integration)
            RUN_INTEGRATION=true
            RUN_ALL=false
            shift
            ;;
        -a|--all)
            RUN_ALL=true
            shift
            ;;
        --forgejo-url)
            FORGEJO_URL="$2"
            shift 2
            ;;
        --repo)
            TEST_REPO="$2"
            shift 2
            ;;
        --token)
            ACCESS_TOKEN="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Set up environment variables
if [[ -n "$FORGEJO_URL" ]]; then
    export FORGEJO_TEST_API_URL="${FORGEJO_URL}/api/v1"
    export FORGEJO_TEST_SERVER_URL="$FORGEJO_URL"
fi

if [[ -n "$TEST_REPO" ]]; then
    export FORGEJO_TEST_REPO="$TEST_REPO"
fi

if [[ -n "$ACCESS_TOKEN" ]]; then
    export FORGEJO_TEST_TOKEN="$ACCESS_TOKEN"
fi

# Display current configuration
echo -e "${YELLOW}Current Configuration:${NC}"
echo "  Forgejo URL: ${FORGEJO_TEST_SERVER_URL:-not set}"
echo "  Test Repo: ${FORGEJO_TEST_REPO:-not set}"
echo "  Has Token: ${FORGEJO_TEST_TOKEN:+yes}"
echo "  Skip Write: ${FORGEJO_TEST_SKIP_WRITE:-false}"
echo ""

# Function to run command or show what would be run
run_or_show() {
    local cmd="$1"
    echo -e "${BLUE}$cmd${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would run: $cmd${NC}"
    else
        eval "$cmd"
    fi
}

# Check if bun is available
if ! command -v bun &> /dev/null; then
    echo -e "${RED}Error: bun is not installed or not in PATH${NC}"
    exit 1
fi

# Run tests based on options
if [[ "$RUN_ALL" == "true" ]] || [[ "$RUN_UNIT" == "true" ]]; then
    echo -e "${GREEN}Running Forgejo Unit Tests...${NC}"
    run_or_show "bun test test/providers/forgejo-provider.test.ts"
    run_or_show "bun test test/mappers/forgejo-mapper.test.ts"
    run_or_show "bun test test/providers/factory.test.ts"
    echo ""
fi

if [[ "$RUN_ALL" == "true" ]] || [[ "$RUN_INTEGRATION" == "true" ]]; then
    echo -e "${GREEN}Running Forgejo Integration Tests...${NC}"
    
    if [[ -z "$FORGEJO_TEST_TOKEN" ]] && [[ -z "$FORGEJO_TEST_API_URL" ]]; then
        echo -e "${YELLOW}Warning: No Forgejo credentials configured. Integration tests may be limited.${NC}"
        echo "Set FORGEJO_TEST_TOKEN and related environment variables for full testing."
        echo ""
    fi
    
    run_or_show "bun test test/integration/forgejo-integration.test.ts"
    run_or_show "bun test test/integration/provider-compatibility.test.ts"
    echo ""
fi

if [[ "$DRY_RUN" != "true" ]]; then
    echo -e "${GREEN}Test execution completed!${NC}"
else
    echo -e "${YELLOW}Dry run completed. No tests were actually executed.${NC}"
fi