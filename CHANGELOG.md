# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### 🎉 Forgejo Support

- **Full Forgejo integration** - Complete support for Forgejo instances with REST API integration
- **Provider abstraction pattern** - Unified interface for GitHub and Forgejo platforms
- **New configuration options**:
  - `forge_type` - Select between 'github' and 'forgejo'
  - `forge_api_url` - API URL for Forgejo instances
  - `forge_server_url` - Server URL for Forgejo instances

#### 📚 Documentation and Examples

- **Forgejo setup guide** (`docs/forgejo-setup-guide.md`) - Comprehensive integration guide
- **Example workflows** for Forgejo:
  - `examples/forgejo-basic.yml` - Basic setup
  - `examples/forgejo-advanced.yml` - Advanced configuration
  - `examples/forgejo-codeberg.yml` - Codeberg (public Forgejo) setup
- **Updated README.md** with Git forge support section and configuration examples

#### 🧪 Testing Infrastructure

- **Integration testing framework** for real Forgejo API testing
- **Cross-provider compatibility tests** ensuring consistent behavior
- **GitHub Actions workflow** for automated Forgejo testing
- **Test utilities** (`scripts/test-forgejo.sh`) for local development
- **Comprehensive unit tests** for all Forgejo providers and mappers

### Changed

#### 🔄 Architecture Improvements

- **Refactored data fetching** from GraphQL-only to provider-based architecture
- **Unified data structures** for consistent behavior across platforms
- **Enhanced error handling** for different API response formats
- **Backward compatibility** maintained for existing GitHub workflows

#### 🛠️ Internal Improvements

- **Provider factory pattern** for clean provider instantiation
- **Data mappers** for transforming platform-specific data to unified format
- **Environment-based configuration** for flexible deployment options
- **REST API integration** alongside existing GraphQL support

### Technical Details

#### New Files Added

```
src/github/providers/
├── factory.ts          # Provider factory and type guards
├── forgejo-client.ts   # Forgejo REST API client
├── forgejo.ts          # Forgejo provider implementation
├── interface.ts        # Unified provider interface
└── types.ts            # Shared provider types

src/github/mappers/
└── forgejo.ts          # Forgejo to unified data mappers

test/integration/
├── forgejo-integration.test.ts       # Real API integration tests
├── provider-compatibility.test.ts    # Cross-provider compatibility
└── README.md                         # Integration testing guide

examples/
├── forgejo-basic.yml     # Basic Forgejo workflow
├── forgejo-advanced.yml  # Advanced Forgejo workflow
└── forgejo-codeberg.yml  # Codeberg-specific workflow

docs/
├── forgejo-setup-guide.md  # Comprehensive setup guide
└── forgejo-support.md       # Implementation documentation

.github/workflows/
└── forgejo-integration.yml  # CI/CD for Forgejo testing

scripts/
└── test-forgejo.sh          # Development testing script
```

#### API Compatibility

- **GitHub REST API** - Full backward compatibility maintained
- **Forgejo REST API** - Complete integration with error handling
- **Data structure consistency** - Unified response format across platforms
- **Authentication** - Token-based auth compatible with both platforms

#### Testing Coverage

- **Unit tests**: 35+ test cases for Forgejo components
- **Integration tests**: Real API testing framework
- **Cross-platform tests**: GitHub/Forgejo compatibility validation
- **CI/CD workflows**: Automated testing on multiple platforms

### Migration Guide

#### For Existing Users

No changes required - existing GitHub workflows continue to work unchanged.

#### For New Forgejo Users

1. Add the new configuration parameters:

   ```yaml
   with:
     forge_type: forgejo
     forge_api_url: https://your-forgejo.com/api/v1
     forge_server_url: https://your-forgejo.com
   ```

2. Use your Forgejo token as `GITHUB_TOKEN`:

   ```yaml
   env:
     GITHUB_TOKEN: ${{ secrets.FORGEJO_TOKEN }}
   ```

3. See [Forgejo Setup Guide](docs/forgejo-setup-guide.md) for detailed instructions

### Acknowledgments

- Thanks to the Forgejo community for API documentation and feedback
- Inspired by the need for self-hosted Git forge support
- Built with extensibility in mind for future Git forge integrations
