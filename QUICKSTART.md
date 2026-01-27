# Quick Start Guide

Get Advanced Google Charts running in under 5 minutes! ⚡

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- A Google Sheets chart to test with

## Installation

```bash
# Navigate to project directory
cd "Advanced Google Charts"

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

## First Chart Embed

### Step 1: Get a Google Sheets Chart

1. Open any Google Sheet with data
2. Select your data → Insert → Chart
3. Click the chart → Three dots menu (⋮) → Publish chart
4. In the "Embed" tab, click "Publish"
5. Copy the entire `<iframe>` code

### Step 2: Generate Responsive Embed

1. Paste the iframe code into the text area
2. See the preview update automatically
3. Customize options (optional):
   - Animation preset: Fade Up (default), Fade, Pop, or Reveal
   - Border radius: 0-24px
   - Background color: Any CSS color
4. Click "Copy" to get your embed code

### Step 3: Use the Embed

**Option A: Copy/paste the snippet**
```html
<!-- Paste the entire generated code into your HTML -->
<div id="gs-chart-...">
  ...generated code here...
</div>
<script>...</script>
```

**Option B: Use the standalone URL**
```html
<!-- Use as an iframe -->
<iframe src="http://localhost:3000/embed?c=..." width="100%" height="400"></iframe>
```

## Test Example

Don't have a chart handy? Try this example:

```html
<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQexample/pubchart?oid=123456789&format=interactive"></iframe>
```

**Note**: This is a placeholder URL. Use your own published chart for real results.

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Check for linting errors
```

## Project Structure

```
Advanced Google Charts/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page (editor)
│   ├── embed/page.tsx     # Embed route
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components (shadcn)
│   └── chart-preview.tsx # Preview component
├── lib/                  # Core logic
│   ├── parser.ts         # Iframe parsing
│   ├── encoding.ts       # Config encoding
│   ├── snippet-generator.ts  # Snippet generation
│   └── types.ts          # TypeScript types
└── __tests__/            # Jest tests
```

## Features Overview

### ✅ V1 (Current)

- ✨ Parse Google Sheets iframe embeds
- 📱 Generate responsive embeds
- 🎬 Add viewport animations
- 🎨 Customize appearance
- 📋 Copy embed code
- 🔗 Generate shareable URLs

### 🚧 V2 (Planned)

- 📊 Apache ECharts renderer
- 🔌 Google Sheets API integration
- 🎨 Full style customization
- 💾 Save/load configurations

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill
# Or use a different port
PORT=3001 npm run dev
```

### Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Chart not loading
- Ensure the Google Sheets chart is published with public access
- Check that the iframe src URL is correct
- Verify your internet connection (chart loads from Google)

### Animation not working
- Check browser console for errors
- Ensure you're scrolling to trigger IntersectionObserver
- Try disabling browser extensions

## Next Steps

📚 **Read the full documentation**
- [README.md](./README.md) - Complete documentation
- [EXAMPLES.md](./EXAMPLES.md) - Example charts and tips
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to production

🧪 **Explore the code**
- Check out the component architecture
- Read the inline code comments
- Run the test suite

🚀 **Deploy your app**
- Deploy to Vercel (recommended)
- Use Netlify or Docker
- Set up custom domain

🎨 **Customize**
- Modify Tailwind theme
- Add more animation presets
- Extend with custom features

## Support

Need help? Check these resources:

1. **Documentation**: Read README.md and EXAMPLES.md
2. **Code Comments**: All functions are well-documented
3. **Tests**: Check `__tests__/` for usage examples
4. **Browser Console**: Look for error messages

## Tips

💡 **Best Practices**:
- Use charts with dimensions 400-1000px wide
- Test embeds on mobile devices
- Set appropriate border radius for your design
- Use "prefers-reduced-motion" friendly animations

⚡ **Performance**:
- Charts scale using GPU-accelerated CSS transforms
- No external API calls (all client-side in V1)
- Minimal JavaScript footprint (~2KB compressed)

♿ **Accessibility**:
- Animations respect `prefers-reduced-motion`
- Semantic HTML structure
- Works with keyboard navigation

---

**Ready to create beautiful, responsive chart embeds? Let's go! 🚀**

Questions? Check the main [README.md](./README.md) for detailed docs.
