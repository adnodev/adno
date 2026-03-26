# Changelog

All notable changes to ADNO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.2] - 2026-03-25

### Added
- Display package version in footer
- Versioning input in CI workflow with automatic GitHub Release creation
 
### Changed
- Migrated CI pipeline from Parcel to npm + Vite
- Rewrote GitHub Actions workflows with custom versioning logic
- Cleaned up Vite config
 
### Fixed
- Missing environment variables in CI
- Release version fix
 
### Removed
- Leftover Parcel configuration and build artifacts
 
