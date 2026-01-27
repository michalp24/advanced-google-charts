# Changelog

All notable changes to Advanced Google Charts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-27

### 🎉 Initial Release

First public release of Advanced Google Charts MVP (V1).

### ✨ Added

#### Core Features
- Parse Google Sheets iframe embed codes
- Generate responsive embed snippets with CSS transform scaling
- Support for viewport-triggered animations (IntersectionObserver)
- URL-based config sharing (base64url encoding)
- Standalone embed route (`/embed?c=...`)

#### Animation Presets
- Fade Up (default)
- Fade
- Pop
- Reveal

#### Customization Options
- Border radius control (0-24px)
- Background color picker
- Animation duration (600ms default)

#### UI Components
- Clean editor interface with preview
- Real-time preview with responsive scaling
- Copy-to-clipboard functionality
- Warnings and error messages for invalid input
- Advanced options panel

#### Technical Features
- TypeScript for type safety
- Zod for runtime validation
- Next.js 15 with App Router
- Tailwind CSS + shadcn/ui components
- Fully client-side (no backend/database)
- ResizeObserver for responsive scaling
- IntersectionObserver for animations
- Respects `prefers-reduced-motion` for accessibility

#### Testing
- Jest test suite
- Parser tests (10+ test cases)
- Encoding/decoding tests (6+ test cases)
- 100% pass rate

#### Documentation
- Comprehensive README.md
- Quick Start Guide (QUICKSTART.md)
- Example charts and tips (EXAMPLES.md)
- Deployment guide (DEPLOYMENT.md)
- Contributing guidelines (CONTRIBUTING.md)

### 🏗️ Architecture

- Pluggable renderer system (prepared for V2 ECharts integration)
- Clean separation of concerns:
  - `lib/parser.ts` - Input parsing
  - `lib/encoding.ts` - Config serialization
  - `lib/snippet-generator.ts` - Embed generation
  - `lib/types.ts` - Type definitions
- Component-based UI with React
- Server and client encoding/decoding functions

### 📦 Dependencies

- Next.js 15.1.5
- React 19.0.0
- TypeScript 5.7.3
- Tailwind CSS 3.4.17
- Zod 3.24.1
- Radix UI components
- Lucide React icons

### 🎯 Limitations (V1)

- Cannot modify internal Google Chart styling (cross-origin iframe)
- Requires chart to be publicly published in Google Sheets
- Scaling uses CSS transform (works well but not pixel-perfect)
- No data editing or chart customization (V2 feature)

### 🔜 Coming Soon (V2)

- Apache ECharts renderer for full styling control
- Google Sheets API integration
- Custom color themes
- Data editing capabilities
- Enhanced customization options

---

## Versioning Strategy

- **Major** (X.0.0): Breaking changes, major new features
- **Minor** (0.X.0): New features, backwards compatible
- **Patch** (0.0.X): Bug fixes, small improvements

## Release Notes Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing features

### Deprecated
- Features marked for removal

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

---

[1.0.0]: https://github.com/yourusername/advanced-google-charts/releases/tag/v1.0.0
