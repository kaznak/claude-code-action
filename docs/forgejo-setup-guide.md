# Forgejo Setup Guide

This guide walks you through setting up claude-code-action with Forgejo, a self-hosted Git service.

## What is Forgejo?

[Forgejo](https://forgejo.org/) is a self-hosted Git service that provides a GitHub-compatible API. It's a community-driven fork of Gitea with a focus on transparency and user privacy. Many organizations use Forgejo for:

- Self-hosted Git repositories
- Private or on-premises development
- Open-source projects (like [Codeberg](https://codeberg.org/))
- Enterprise environments with strict data requirements

## Prerequisites

- A Forgejo instance (self-hosted or public like Codeberg)
- Personal access token for your Forgejo instance
- Repository with GitHub Actions enabled
- Claude API access (Anthropic, AWS Bedrock, or Google Vertex AI)

## Quick Setup

### 1. Generate Forgejo Access Token

1. Go to your Forgejo instance (e.g., `https://your-forgejo.com`)
2. Navigate to **User Settings** → **Applications** → **Access Tokens**
3. Click **Generate New Token**
4. Give it a descriptive name (e.g., "Claude Code Action")
5. Select the following permissions:
   - `repo` - Full repository access
   - `read:user` - Read user information
6. Generate and copy the token

### 2. Add Secrets to Your Repository

In your repository settings:

1. Go to **Settings** → **Secrets and Variables** → **Actions**
2. Add these secrets:
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `FORGEJO_TOKEN` - The token from step 1

### 3. Create Workflow File

Create `.github/workflows/claude-forgejo.yml`:

```yaml
name: Claude for Forgejo

on:
  issue_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude-response:
    runs-on: ubuntu-latest
    if: contains(github.event.comment.body, '@claude') || contains(github.event.issue.body, '@claude') || contains(github.event.review.body, '@claude')

    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          forge_type: forgejo
          forge_api_url: https://your-forgejo-instance.com/api/v1
          forge_server_url: https://your-forgejo-instance.com
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.FORGEJO_TOKEN }}
```

### 4. Test the Setup

1. Create an issue or PR in your repository
2. Add a comment mentioning `@claude`
3. Watch Claude respond with helpful analysis!

## Configuration Options

### Environment Variables

You can also configure Forgejo settings using environment variables:

```yaml
env:
  FORGE_TYPE: forgejo
  FORGE_API_URL: https://your-forgejo-instance.com/api/v1
  FORGE_SERVER_URL: https://your-forgejo-instance.com
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  GITHUB_TOKEN: ${{ secrets.FORGEJO_TOKEN }}
```

### Repository Variables

For organization-wide settings, use repository variables:

1. Go to **Settings** → **Secrets and Variables** → **Variables**
2. Add:
   - `FORGEJO_API_URL` = `https://your-forgejo-instance.com/api/v1`
   - `FORGEJO_SERVER_URL` = `https://your-forgejo-instance.com`

Then reference them in your workflow:

```yaml
with:
  forge_type: forgejo
  forge_api_url: ${{ vars.FORGEJO_API_URL }}
  forge_server_url: ${{ vars.FORGEJO_SERVER_URL }}
```

## Common Forgejo Instances

### Codeberg (Public)

[Codeberg](https://codeberg.org/) is a public Forgejo instance for open-source projects:

```yaml
with:
  forge_type: forgejo
  forge_api_url: https://codeberg.org/api/v1
  forge_server_url: https://codeberg.org
```

### Self-Hosted Instances

For your own Forgejo server:

```yaml
with:
  forge_type: forgejo
  forge_api_url: https://git.yourcompany.com/api/v1
  forge_server_url: https://git.yourcompany.com
```

## Advanced Configuration

### Multiple Trigger Methods

```yaml
with:
  forge_type: forgejo
  forge_api_url: https://your-forgejo.com/api/v1
  forge_server_url: https://your-forgejo.com
  trigger_phrase: "@claude"
  assignee_trigger: "claude-bot"
  label_trigger: "claude-help"
```

### Custom Instructions

```yaml
with:
  forge_type: forgejo
  forge_api_url: https://your-forgejo.com/api/v1
  forge_server_url: https://your-forgejo.com
  custom_instructions: |
    You are working on a company internal project.
    Follow our coding standards and security guidelines.
    Always consider data privacy implications.
```

### Enhanced Tool Access

```yaml
with:
  forge_type: forgejo
  forge_api_url: https://your-forgejo.com/api/v1
  forge_server_url: https://your-forgejo.com
  allowed_tools: |
    mcp__file_ops__read
    mcp__file_ops__write
    npm
    docker
  disallowed_tools: |
    rm
    sudo
```

## Alternative Authentication Methods

### AWS Bedrock

```yaml
with:
  forge_type: forgejo
  forge_api_url: https://your-forgejo.com/api/v1
  forge_server_url: https://your-forgejo.com
  use_bedrock: true
  model: anthropic.claude-3-5-sonnet-20241022-v2:0
env:
  AWS_REGION: us-west-2
  AWS_ROLE_ARN: ${{ secrets.AWS_ROLE_ARN }}
  GITHUB_TOKEN: ${{ secrets.FORGEJO_TOKEN }}
```

### Google Vertex AI

```yaml
with:
  forge_type: forgejo
  forge_api_url: https://your-forgejo.com/api/v1
  forge_server_url: https://your-forgejo.com
  use_vertex: true
  model: claude-3-5-sonnet@20241022
env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_SERVICE_ACCOUNT: ${{ secrets.GCP_SERVICE_ACCOUNT }}
  GITHUB_TOKEN: ${{ secrets.FORGEJO_TOKEN }}
```

### Claude Code OAuth

For Claude Code Pro/Max users:

```yaml
env:
  CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
  GITHUB_TOKEN: ${{ secrets.FORGEJO_TOKEN }}
```

## Troubleshooting

### Common Issues

1. **"Authentication failed"**

   - Verify your Forgejo token has the correct permissions
   - Check that the token hasn't expired

2. **"API endpoint not found"**

   - Ensure `forge_api_url` ends with `/api/v1`
   - Verify your Forgejo instance is accessible

3. **"Repository not found"**

   - Check the repository name format is correct
   - Verify the token has access to the repository

4. **"Workflow not triggering"**
   - Check the workflow trigger conditions
   - Ensure Actions are enabled in your repository

### Debug Mode

Enable debug logging by adding:

```yaml
with:
  # ... other configuration
  claude_env: |
    DEBUG: 1
    LOG_LEVEL: debug
```

### Network Restrictions

If your Forgejo instance is behind a firewall:

```yaml
with:
  forge_type: forgejo
  forge_api_url: https://internal-forgejo.company.com/api/v1
  forge_server_url: https://internal-forgejo.company.com
  experimental_allowed_domains: |
    api.anthropic.com
    internal-forgejo.company.com
```

## Best Practices

1. **Security**

   - Use repository secrets for sensitive tokens
   - Limit token permissions to minimum required
   - Regularly rotate access tokens

2. **Performance**

   - Set appropriate timeout values
   - Limit conversation turns for long discussions
   - Use specific trigger phrases to avoid unnecessary runs

3. **Maintenance**

   - Monitor workflow run costs
   - Keep the action version updated
   - Review and clean up old branches created by Claude

4. **Team Collaboration**
   - Document your trigger phrases and conventions
   - Train team members on effective Claude usage
   - Set up notification systems for failures

## Getting Help

- Check the [main README](../README.md) for general configuration
- Review [example workflows](../examples/) for inspiration
- Report issues at [GitHub Issues](https://github.com/anthropics/claude-code-action/issues)
- Join the community discussions for tips and tricks

## Migration from GitHub

If you're migrating from GitHub to Forgejo:

1. Export your repositories from GitHub
2. Import them to your Forgejo instance
3. Update your workflows to use `forge_type: forgejo`
4. Replace `GITHUB_TOKEN` with your Forgejo token
5. Test the setup with a simple comment

The claude-code-action will work identically on both platforms!
