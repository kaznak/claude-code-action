import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { 
  createGitForgeProvider, 
  createGitForgeProviderFromEnv,
  isGitHubProvider,
  isForgejoProvider
} from "../../src/github/providers/factory";
import { GitHubProvider } from "../../src/github/providers/github";
import { ForgejoProvider } from "../../src/github/providers/forgejo";
import type { GitForgeConfig } from "../../src/github/providers/interface";
import { createOctokit } from "../../src/github/api/client";

describe("Provider Factory", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("createGitForgeProvider", () => {
    test("creates GitHub provider with octokits", () => {
      const config: GitForgeConfig = {
        type: 'github',
        apiUrl: 'https://api.github.com',
        serverUrl: 'https://github.com',
        token: 'test-token',
      };
      
      const octokits = createOctokit('test-token');
      const provider = createGitForgeProvider('github', config, octokits);
      
      expect(provider).toBeInstanceOf(GitHubProvider);
      expect(provider.getProviderType()).toBe('github');
    });

    test("throws error when creating GitHub provider without octokits", () => {
      const config: GitForgeConfig = {
        type: 'github',
        apiUrl: 'https://api.github.com',
        serverUrl: 'https://github.com',
        token: 'test-token',
      };
      
      expect(() => {
        createGitForgeProvider('github', config);
      }).toThrow("Octokits instance is required for GitHub provider");
    });

    test("creates Forgejo provider without octokits", () => {
      const config: GitForgeConfig = {
        type: 'forgejo',
        apiUrl: 'https://forgejo.example.com/api/v1',
        serverUrl: 'https://forgejo.example.com',
        token: 'test-token',
      };
      
      const provider = createGitForgeProvider('forgejo', config);
      
      expect(provider).toBeInstanceOf(ForgejoProvider);
      expect(provider.getProviderType()).toBe('forgejo');
    });

    test("throws error for unknown provider type", () => {
      const config: GitForgeConfig = {
        type: 'github',
        apiUrl: '',
        serverUrl: '',
        token: '',
      };
      
      expect(() => {
        createGitForgeProvider('unknown' as any, config);
      }).toThrow("Unknown Git forge provider type: unknown");
    });
  });

  describe("createGitForgeProviderFromEnv", () => {
    test("creates GitHub provider from environment variables", () => {
      process.env.FORGE_TYPE = 'github';
      process.env.GITHUB_TOKEN = 'test-github-token';
      process.env.FORGE_API_URL = 'https://api.github.com';
      process.env.FORGE_SERVER_URL = 'https://github.com';
      
      const octokits = createOctokit('test-github-token');
      const provider = createGitForgeProviderFromEnv(octokits);
      
      expect(provider).toBeInstanceOf(GitHubProvider);
      expect(provider.getProviderType()).toBe('github');
    });

    test("creates Forgejo provider from environment variables", () => {
      process.env.FORGE_TYPE = 'forgejo';
      process.env.GITHUB_TOKEN = 'test-forgejo-token';
      process.env.FORGE_API_URL = 'https://forgejo.example.com/api/v1';
      process.env.FORGE_SERVER_URL = 'https://forgejo.example.com';
      
      const provider = createGitForgeProviderFromEnv();
      
      expect(provider).toBeInstanceOf(ForgejoProvider);
      expect(provider.getProviderType()).toBe('forgejo');
    });

    test("defaults to GitHub when FORGE_TYPE is not set", () => {
      process.env.GITHUB_TOKEN = 'test-token';
      delete process.env.FORGE_TYPE;
      
      const octokits = createOctokit('test-token');
      const provider = createGitForgeProviderFromEnv(octokits);
      
      expect(provider).toBeInstanceOf(GitHubProvider);
    });

    test("throws error when token is not provided", () => {
      delete process.env.GITHUB_TOKEN;
      
      expect(() => {
        createGitForgeProviderFromEnv();
      }).toThrow("Authentication token is required (GITHUB_TOKEN environment variable)");
    });
  });

  describe("Type Guards", () => {
    test("isGitHubProvider correctly identifies GitHub provider", () => {
      const config: GitForgeConfig = {
        type: 'github',
        apiUrl: 'https://api.github.com',
        serverUrl: 'https://github.com',
        token: 'test-token',
      };
      
      const octokits = createOctokit('test-token');
      const githubProvider = createGitForgeProvider('github', config, octokits);
      const forgejoProvider = createGitForgeProvider('forgejo', config);
      
      expect(isGitHubProvider(githubProvider)).toBe(true);
      expect(isGitHubProvider(forgejoProvider)).toBe(false);
    });

    test("isForgejoProvider correctly identifies Forgejo provider", () => {
      const config: GitForgeConfig = {
        type: 'forgejo',
        apiUrl: 'https://forgejo.example.com/api/v1',
        serverUrl: 'https://forgejo.example.com',
        token: 'test-token',
      };
      
      const octokits = createOctokit('test-token');
      const githubProvider = createGitForgeProvider('github', { ...config, type: 'github' }, octokits);
      const forgejoProvider = createGitForgeProvider('forgejo', config);
      
      expect(isForgejoProvider(forgejoProvider)).toBe(true);
      expect(isForgejoProvider(githubProvider)).toBe(false);
    });
  });
});