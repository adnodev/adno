# Changelog

All notable changes to ADNO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- IIIF Presentation 3 Manifest export: one Canvas per image, `label`, `summary`, `provider`, `rights` and `requiredStatement`, comments in the Canvas `annotations`
- Web Annotation collection export sharing the same `adno:project` extension, declared in `https://w.adno.app/ns/context.json`
- Unified import: Adno exports (current and former), third-party IIIF Presentation 2 and 3 Manifests, Web Annotation collections and `info.json`, from a file, a URL or an embed
- Separate `licence` and `attribution` project fields
- Unit test suite (Vitest) with JSON-LD expansion and IIIF validator check in CI
- Format documentation in `docs/format.md`

### Changed
- Annotations are stored as Web Annotations: a single `text/html` `TextualBody`, markdown source in `adno:sourceMarkdown`, cutouts in `adno:cutouts`, integer `xywh` coordinates
- Existing projects are migrated when first read
- Importing a project from a URL or a file no longer asks for confirmation; feedback is shown as a toast
- A third-party Manifest that contains annotations is imported as a project instead of opening the image picker
- Embedding a plain image or a third-party Manifest applies the default project settings (toolbar shown, 5 s delay, outlines) where nothing was set before

### Removed
- `HTMLBody` bodies, Base64 settings in Manifest `metadata`, the `format: "Adno"` export keys

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
 
