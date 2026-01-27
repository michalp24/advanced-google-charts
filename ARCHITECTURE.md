# Architecture Documentation

This document provides a detailed overview of the Advanced Google Charts architecture, design decisions, and implementation patterns.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Flow](#data-flow)
4. [Component Architecture](#component-architecture)
5. [Core Modules](#core-modules)
6. [Type System](#type-system)
7. [Rendering Pipeline](#rendering-pipeline)
8. [Future Architecture (V2)](#future-architecture-v2)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Next.js App (Client-Side)                │ │
│  │                                                       │ │
│  │  ┌─────────────┐      ┌──────────────┐             │ │
│  │  │   Home Page │      │  Embed Page  │             │ │
│  │  │   (Editor)  │      │  (Renderer)  │             │ │
│  │  └──────┬──────┘      └──────┬───────┘             │ │
│  │         │                     │                      │ │
│  │         └─────────┬───────────┘                      │ │
│  │                   │                                  │ │
│  │         ┌─────────▼─────────┐                       │ │
│  │         │   Core Libraries   │                       │ │
│  │         │  - Parser          │                       │ │
│  │         │  - Encoder         │                       │ │
│  │         │  - Generator       │                       │ │
│  │         │  - Types/Schemas   │                       │ │
│  │         └────────────────────┘                       │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ (iframe src)
                         ▼
              ┌──────────────────────┐
              │  Google Sheets API   │
              │  (docs.google.com)   │
              └──────────────────────┘
```

### Key Characteristics

- **Fully Client-Side**: All processing happens in the browser
- **Stateless**: No server-side storage or sessions
- **Zero Backend**: No API routes or server functions in V1
- **Cross-Origin Safe**: Respects iframe security boundaries

---

## Architecture Diagram

### Component Hierarchy

```
app/
├── layout.tsx (Root Layout)
│
├── page.tsx (Home/Editor)
│   ├── <Textarea> (Input)
│   ├── <ChartPreview> (Live Preview)
│   ├── <Select> (Animation Preset)
│   ├── <Slider> (Border Radius)
│   ├── <Input> (Background Color)
│   └── <Textarea> (Generated Code)
│
└── embed/
    └── page.tsx (Embed Renderer)
        └── <EmbedRenderer> (Standalone Chart)

components/
├── ui/ (shadcn/ui primitives)
│   ├── button.tsx
│   ├── textarea.tsx
│   ├── select.tsx
│   ├── slider.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── alert.tsx
│
└── chart-preview.tsx (Preview Component)

lib/
├── types.ts (Type Definitions)
├── parser.ts (Input Parsing)
├── encoding.ts (Serialization)
├── snippet-generator.ts (Code Generation)
└── utils.ts (Utilities)
```

---

## Data Flow

### User Journey: Creating an Embed

```
1. User Input
   │
   ├─> Paste iframe code
   │
   ▼
2. Parsing (lib/parser.ts)
   │
   ├─> Extract src, width, height
   ├─> Validate input
   ├─> Generate warnings/errors
   │
   ▼
3. Config Creation
   │
   ├─> Create GoogleEmbedConfig
   ├─> Apply user options (animation, radius, bg)
   ├─> Validate with Zod schema
   │
   ▼
4. Preview (components/chart-preview.tsx)
   │
   ├─> Render iframe with responsive wrapper
   ├─> Apply ResizeObserver for scaling
   ├─> Apply IntersectionObserver for animation
   │
   ▼
5. Snippet Generation (lib/snippet-generator.ts)
   │
   ├─> Generate HTML wrapper
   ├─> Inject inline CSS
   ├─> Inject inline JavaScript
   ├─> Return complete snippet
   │
   ▼
6. URL Encoding (lib/encoding.ts)
   │
   ├─> Serialize config to JSON
   ├─> Encode to base64url
   ├─> Generate /embed?c=... URL
   │
   ▼
7. Output
   │
   ├─> Copy snippet to clipboard
   └─> Open standalone embed URL
```

### Embed Rendering Flow

```
1. User visits /embed?c=base64url
   │
   ▼
2. URL Parsing
   │
   ├─> Extract 'c' query parameter
   │
   ▼
3. Decoding (lib/encoding.ts)
   │
   ├─> Decode base64url to JSON
   ├─> Validate with Zod schema
   ├─> Handle errors gracefully
   │
   ▼
4. Renderer Selection
   │
   ├─> Check config.mode
   ├─> Route to appropriate renderer
   │   ├─> "google-embed" → GoogleEmbedRenderer
   │   └─> "echarts" → EChartsRenderer (V2)
   │
   ▼
5. Render Chart
   │
   ├─> Create responsive wrapper
   ├─> Apply ResizeObserver
   ├─> Apply IntersectionObserver
   ├─> Render iframe with Google chart
   │
   ▼
6. Display
   │
   └─> Show chart to user
```

---

## Component Architecture

### Home Page (Editor)

**File**: `app/page.tsx`

**Responsibilities**:
- Accept user input (iframe code)
- Parse and validate input
- Display preview
- Provide customization options
- Generate embed snippet
- Handle copy-to-clipboard

**State Management**:
```typescript
const [iframeInput, setIframeInput] = useState("");
const [config, setConfig] = useState<GoogleEmbedConfig | null>(null);
const [warnings, setWarnings] = useState<string[]>([]);
const [errors, setErrors] = useState<string[]>([]);
const [generatedSnippet, setGeneratedSnippet] = useState("");
const [embedUrl, setEmbedUrl] = useState("");
const [animationPreset, setAnimationPreset] = useState("fade-up");
const [borderRadius, setBorderRadius] = useState(0);
const [backgroundColor, setBackgroundColor] = useState("");
```

**Effects**:
1. Parse input → Update config
2. Config changes → Generate snippet
3. Config changes → Generate embed URL

### Chart Preview Component

**File**: `components/chart-preview.tsx`

**Responsibilities**:
- Render live preview of chart
- Apply responsive scaling (ResizeObserver)
- Apply viewport animation (IntersectionObserver)
- Match generated snippet behavior

**Key Features**:
- Uses same scaling logic as generated snippet
- Respects `prefers-reduced-motion`
- Handles multiple animation presets
- Updates in real-time

### Embed Page (Renderer)

**File**: `app/embed/page.tsx`

**Responsibilities**:
- Decode config from URL
- Validate config
- Render chart standalone
- Handle errors gracefully

**Suspense Boundary**:
```typescript
<Suspense fallback={<Loading />}>
  <EmbedContent />
</Suspense>
```

---

## Core Modules

### 1. Parser (`lib/parser.ts`)

**Purpose**: Parse user input and extract chart configuration

**Input**: 
- Full iframe HTML tag
- URL only

**Output**:
```typescript
interface ParseResult {
  success: boolean;
  config?: Partial<GoogleEmbedConfig>;
  warnings: string[];
  errors: string[];
}
```

**Logic**:
1. Detect input type (iframe vs URL)
2. Extract attributes using regex
3. Validate src URL
4. Apply defaults for missing values
5. Generate warnings for issues

**Edge Cases Handled**:
- Missing width/height → Use defaults (700x300)
- Single vs double quotes → Regex handles both
- Non-Google URLs → Warning, but still process
- Malformed HTML → Clear error message

### 2. Encoder (`lib/encoding.ts`)

**Purpose**: Serialize/deserialize configs for URL sharing

**Functions**:
- `encodeConfig(config)` - Server-side encoding
- `decodeConfig(encoded)` - Server-side decoding
- `encodeConfigClient(config)` - Browser encoding
- `decodeConfigClient(encoded)` - Browser decoding

**Format**: base64url (URL-safe base64)
- Replace `+` with `-`
- Replace `/` with `_`
- Remove padding `=`

**Validation**: All decoded configs validated with Zod

### 3. Snippet Generator (`lib/snippet-generator.ts`)

**Purpose**: Generate self-contained embed HTML

**Output Structure**:
```html
<div id="gs-chart-{random}" class="gs-chart-wrapper" style="...">
  <div class="gs-chart-stage" style="...">
    <iframe src="..." width="..." height="..." ...></iframe>
  </div>
</div>
<script>
  (function() {
    // Responsive scaling logic
    // Animation logic
  })();
</script>
```

**Features**:
- Unique ID per chart (supports multiple charts)
- Inline CSS (no external dependencies)
- Vanilla JS (no libraries)
- ResizeObserver for scaling
- IntersectionObserver for animation
- Respects `prefers-reduced-motion`

### 4. Type System (`lib/types.ts`)

**Purpose**: Define types and runtime validation schemas

**Key Types**:
```typescript
type RendererMode = "google-embed" | "echarts";
type AnimationPreset = "fade-up" | "fade" | "pop" | "reveal";

interface RenderConfigBase {
  mode: RendererMode;
  animate: {
    preset: AnimationPreset;
    durationMs: number;
  };
}

interface GoogleEmbedConfig extends RenderConfigBase {
  mode: "google-embed";
  src: string;
  baseWidth: number;
  baseHeight: number;
  frame: {
    radiusPx: number;
    backgroundColor?: string;
  };
}
```

**Validation**: All schemas defined with Zod for runtime validation

---

## Type System

### Discriminated Union Pattern

The renderer system uses TypeScript's discriminated unions for type safety:

```typescript
type RenderConfig = 
  | GoogleEmbedConfig  // mode: "google-embed"
  | EChartsConfig;     // mode: "echarts"

// TypeScript can narrow types based on mode
function render(config: RenderConfig) {
  if (config.mode === "google-embed") {
    // config is GoogleEmbedConfig here
    return renderGoogleEmbed(config);
  } else {
    // config is EChartsConfig here
    return renderECharts(config);
  }
}
```

### Zod Schemas

Runtime validation ensures type safety at boundaries:

```typescript
// Define schema
const GoogleEmbedConfigSchema = z.object({
  mode: z.literal("google-embed"),
  src: z.string().url(),
  baseWidth: z.number().positive(),
  // ...
});

// Validate at runtime
const config = GoogleEmbedConfigSchema.parse(userInput);
```

---

## Rendering Pipeline

### Responsive Scaling Algorithm

**Problem**: Cannot access iframe DOM (cross-origin)

**Solution**: Scale the entire iframe using CSS transforms

```typescript
// 1. Get container dimensions
const containerWidth = wrapper.offsetWidth;
const containerHeight = wrapper.offsetHeight;

// 2. Calculate scale factor
const scale = Math.min(
  containerWidth / baseWidth,
  containerHeight / baseHeight
);

// 3. Apply transform
stage.style.transform = `scale(${scale})`;
```

**Why This Works**:
- Maintains aspect ratio
- Preserves iframe interactivity
- GPU accelerated (smooth)
- Works with any iframe content

### Animation System

**Implementation**: IntersectionObserver API

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Trigger animation
        wrapper.style.opacity = '1';
        wrapper.style.transform = 'translateY(0)';
        observer.unobserve(wrapper);
      }
    });
  },
  { threshold: 0.1 } // Trigger when 10% visible
);

observer.observe(wrapper);
```

**Accessibility**:
```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // Skip animation
  wrapper.style.opacity = '1';
  wrapper.style.transform = 'none';
}
```

---

## Future Architecture (V2)

### Adding ECharts Renderer

**New Files**:
```
lib/
├── renderers/
│   ├── google-embed.ts (extract from snippet-generator.ts)
│   └── echarts.ts (new)
├── parsers/
│   ├── iframe-parser.ts (extract from parser.ts)
│   └── gviz-parser.ts (new - parse Google viz data)
└── data-sources/
    ├── sheets-api.ts (new - Google Sheets API)
    └── gviz.ts (new - Public gviz endpoint)
```

**New Types**:
```typescript
interface EChartsConfig extends RenderConfigBase {
  mode: "echarts";
  dataSource: {
    type: "gviz" | "sheets-api";
    url?: string;
    sheetId?: string;
    range?: string;
  };
  option: EChartsOption; // ECharts configuration
  themeTokens?: Record<string, any>;
}
```

**Renderer Selection**:
```typescript
function generateSnippet(config: RenderConfig): string {
  switch (config.mode) {
    case "google-embed":
      return generateGoogleEmbedSnippet(config);
    case "echarts":
      return generateEChartsSnippet(config);
    default:
      throw new Error(`Unknown renderer: ${config.mode}`);
  }
}
```

### Data Flow (V2)

```
1. User provides Google Sheets URL
   │
   ▼
2. Fetch data via API
   │
   ├─> Option A: Public gviz endpoint
   └─> Option B: Google Sheets API (OAuth)
   │
   ▼
3. Parse data structure
   │
   ├─> Detect chart type
   ├─> Extract data series
   ├─> Extract labels/axes
   │
   ▼
4. Convert to ECharts format
   │
   ├─> Map chart types
   ├─> Transform data structure
   ├─> Apply theme/colors
   │
   ▼
5. Generate ECharts config
   │
   ├─> Create ECharts option object
   ├─> Apply customizations
   │
   ▼
6. Generate snippet
   │
   ├─> Include ECharts library
   ├─> Embed chart config
   ├─> Add initialization code
   │
   ▼
7. Output
   │
   └─> Fully customizable chart
```

---

## Design Decisions

### Why Client-Side Only (V1)?

**Pros**:
- No server costs
- Instant deployment
- Scales infinitely (CDN)
- No database to manage
- Simple architecture

**Cons**:
- Cannot fetch private data
- Limited to public charts
- No server-side caching

**Decision**: Client-side is perfect for V1 MVP. V2 can add server features.

### Why CSS Transform Scaling?

**Alternatives Considered**:
1. Responsive iframe (impossible - cross-origin)
2. Recreate chart (requires data access - V2 feature)
3. Server-side screenshot (slow, expensive)

**Chosen**: CSS transform
- Fast (GPU accelerated)
- Maintains interactivity
- Works with any iframe
- Simple implementation

### Why Inline Snippet vs Hosted Script?

**V1 Choice**: Inline snippet
- Works immediately
- No external dependencies
- No CDN to maintain
- Copy/paste simplicity

**V2 Option**: Hosted script
- Easier updates
- Smaller snippet size
- Centralized logic
- Analytics possible

**Decision**: Start with inline, add hosted option in V2

---

## Performance Considerations

### Bundle Size Optimization

**Techniques**:
- Tree-shaking (ES modules)
- Code splitting (dynamic imports)
- Minimal dependencies
- No heavy libraries

**Results**:
- Home page: 169 KB first load
- Embed page: 124 KB first load
- Shared chunks: 102 KB

### Runtime Performance

**Optimizations**:
- CSS transforms (GPU accelerated)
- ResizeObserver (efficient resize detection)
- IntersectionObserver (efficient scroll detection)
- Debouncing not needed (observers are efficient)

### Caching Strategy

**V1 (Static)**:
- All pages static (no SSR)
- Aggressive CDN caching
- No API calls to cache

**V2 (Dynamic)**:
- Cache Google Sheets data (Redis)
- Cache ECharts configs
- Stale-while-revalidate

---

## Security Considerations

### Input Validation

**Threats**:
- XSS via malicious iframe src
- Code injection via user input

**Mitigations**:
- Zod schema validation
- URL validation (must be valid URL)
- No `dangerouslySetInnerHTML`
- Safe regex parsing

### Cross-Origin Safety

**Iframe Security**:
- Cannot access iframe DOM (browser security)
- Cannot inject scripts into iframe
- Cannot read iframe content

**Our Approach**:
- Respect cross-origin boundaries
- Only manipulate wrapper (not iframe)
- No attempts to bypass security

### URL Encoding

**Threats**:
- Malicious configs in URLs
- Injection via encoded data

**Mitigations**:
- Validate decoded configs with Zod
- Catch and handle decode errors
- Display user-friendly error messages

---

## Testing Strategy

### Unit Tests

**Coverage**:
- Parser: All input types and edge cases
- Encoder: Round-trip, validation, errors
- Type validation: Schema correctness

**Philosophy**:
- Test public APIs
- Test edge cases
- Test error conditions
- Don't test implementation details

### Integration Tests (Future)

**V2 Needs**:
- API integration tests
- End-to-end tests (Playwright)
- Visual regression tests

---

## Scalability

### V1 Scalability

**Horizontal Scaling**: ∞
- Static site on CDN
- No server to scale
- No database to scale

**Limitations**: None (for V1 use case)

### V2 Scalability

**Considerations**:
- API rate limits (Google Sheets)
- Database connections
- Server capacity
- Caching strategy

**Solutions**:
- Serverless functions (auto-scale)
- Connection pooling
- Redis caching
- Queue for heavy operations

---

## Monitoring & Observability (Future)

### V1 Monitoring

**Current**: None needed (static site)

**Optional**:
- Vercel Analytics (pageviews)
- Error tracking (Sentry)

### V2 Monitoring

**Needed**:
- API response times
- Error rates
- Cache hit rates
- User analytics
- Performance metrics

**Tools**:
- Vercel Analytics
- Sentry (errors)
- Datadog/New Relic (APM)
- Custom dashboards

---

## Conclusion

The Advanced Google Charts architecture is designed for:
- **Simplicity** in V1 (client-side only)
- **Extensibility** for V2 (pluggable renderers)
- **Performance** (static, CDN-ready)
- **Security** (validated, safe)
- **Maintainability** (clean, documented)

The architecture successfully balances immediate needs (V1 MVP) with future requirements (V2 features) without over-engineering.

---

*For implementation details, see the source code and inline documentation.*
