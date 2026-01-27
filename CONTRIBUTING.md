# Contributing to Advanced Google Charts

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Architecture Guidelines](#architecture-guidelines)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions professional

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Setup

1. **Fork and clone**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/advanced-google-charts.git
   cd advanced-google-charts
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/improvements

### 2. Make Changes

- Write clean, documented code
- Follow existing code style
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run tests
npm test

# Check linting
npm run lint

# Build to ensure no errors
npm run build
```

### 4. Commit Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new animation preset 'bounce'"
git commit -m "fix: resolve responsive scaling issue on iOS"
git commit -m "docs: update README with new examples"
git commit -m "test: add tests for parser edge cases"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Define interfaces for complex objects
- Use Zod for runtime validation
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// Good
interface ChartConfig {
  width: number;
  height: number;
}

// Avoid
const config: any = {...};
```

### React Components

- Use functional components with hooks
- Use `"use client"` directive for client components
- Keep components focused (single responsibility)
- Extract reusable logic into custom hooks

```typescript
// Good
"use client";

import { useState } from "react";

export function MyComponent() {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}
```

### File Organization

```
app/                  # Next.js routes
components/           # React components
  ui/                 # Reusable UI components
  [feature].tsx       # Feature-specific components
lib/                  # Core logic (non-React)
  types.ts           # Type definitions
  utils.ts           # Utilities
  [feature].ts       # Feature logic
__tests__/           # Test files
```

### Naming Conventions

- **Files**: kebab-case (`chart-preview.tsx`)
- **Components**: PascalCase (`ChartPreview`)
- **Functions**: camelCase (`parseIframeInput`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_WIDTH`)
- **Interfaces/Types**: PascalCase (`GoogleEmbedConfig`)

### Code Style

- Use Prettier for formatting (follows project config)
- Max line length: 100 characters
- Use 2 spaces for indentation
- Always use semicolons
- Prefer const over let
- Use template literals for strings

```typescript
// Good
const message = `Hello, ${name}!`;
const items = ["a", "b", "c"];

// Avoid
var message = 'Hello, ' + name + '!';
let items = ["a", "b", "c"]; // if not reassigned
```

## Testing

### Writing Tests

- Test files go in `__tests__/` directory
- Name test files `[feature].test.ts`
- Use descriptive test names
- Test edge cases and error conditions

```typescript
describe("parseIframeInput", () => {
  it("should parse valid iframe tag", () => {
    const result = parseIframeInput("<iframe ...>");
    expect(result.success).toBe(true);
  });

  it("should handle missing width attribute", () => {
    const result = parseIframeInput("<iframe src='...' />");
    expect(result.warnings).toContain("No width attribute found");
  });
});
```

### Test Coverage

- Aim for 80%+ coverage for core logic
- Focus on testing:
  - Parsing functions
  - Encoding/decoding
  - Configuration validation
  - Error handling

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guide
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] PR description explains changes
- [ ] Screenshots included (for UI changes)

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test the changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code reviewed
```

## Architecture Guidelines

### Core Principles

1. **Stateless in V1**: No backend storage or database
2. **Client-side First**: All processing happens in the browser
3. **Type Safety**: Use TypeScript and Zod for validation
4. **Modularity**: Keep functions small and focused
5. **Extensibility**: Design for V2 features (ECharts, API integration)

### Adding New Features

#### Adding an Animation Preset

1. Update `AnimationPreset` type in `lib/types.ts`:
   ```typescript
   export const AnimationPreset = z.enum(["fade-up", "fade", "pop", "reveal", "bounce"]);
   ```

2. Add animation logic in `lib/snippet-generator.ts`:
   ```typescript
   case "bounce":
     return { initial: "transform: scale(0.8);" };
   ```

3. Update preview component in `components/chart-preview.tsx`

4. Add select option in `app/page.tsx`

5. Add tests for new preset

#### Adding a New Renderer (V2)

1. Define config schema in `lib/types.ts`:
   ```typescript
   export const MyRendererConfigSchema = RenderConfigBaseSchema.extend({
     mode: z.literal("my-renderer"),
     // ... specific fields
   });
   ```

2. Create renderer file `lib/renderers/my-renderer.ts`:
   ```typescript
   export function generateMyRendererSnippet(config: MyRendererConfig): string {
     // Implementation
   }
   ```

3. Update `RenderConfigSchema` union in `lib/types.ts`

4. Add renderer support in `/embed` route

5. Add UI toggle in home page

### File Structure for New Features

```
lib/
  renderers/           # Renderer implementations
    google-embed.ts    # V1 Google embed renderer
    echarts.ts         # V2 ECharts renderer (future)
  parsers/             # Input parsers
    iframe-parser.ts   # Current iframe parser
    gviz-parser.ts     # Future: Google viz parser
  validators/          # Validation logic
    config-validator.ts
```

## Documentation

### Inline Documentation

- Use JSDoc comments for functions
- Document parameters and return values
- Add examples for complex functions

```typescript
/**
 * Parse user-provided iframe embed code or URL
 * @param input - Raw iframe HTML or URL string
 * @returns ParseResult with config or errors
 * @example
 * parseIframeInput('<iframe src="..." width="600" height="400"></iframe>')
 */
export function parseIframeInput(input: string): ParseResult {
  // ...
}
```

### README Updates

When adding features, update:
- Feature list
- API reference
- Usage examples
- Architecture diagrams (if applicable)

## Performance Considerations

- Keep bundle size small (<100KB for core)
- Use dynamic imports for heavy features
- Optimize images (use Next.js Image component)
- Lazy load non-critical components
- Profile with React DevTools

## Accessibility

Ensure all contributions maintain accessibility:
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Screen reader compatibility
- Color contrast (WCAG AA minimum)
- Respect `prefers-reduced-motion`

## Security

- Never store sensitive data client-side
- Validate all user input
- Sanitize HTML/URLs
- Use HTTPS in production
- Follow OWASP guidelines

## Questions?

- Check existing issues on GitHub
- Review documentation (README, EXAMPLES, etc.)
- Ask in PR comments
- Reach out to maintainers

## Thank You!

Your contributions help make Advanced Google Charts better for everyone. We appreciate your time and effort! 🎉

---

Happy coding! 🚀
