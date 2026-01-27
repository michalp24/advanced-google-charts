# Example Embeds

Here are some example iframe codes you can use to test the application.

## Example 1: Basic Bar Chart

```html
<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQexample1/pubchart?oid=123456789&format=interactive"></iframe>
```

## Example 2: Line Chart with Custom Dimensions

```html
<iframe width="800" height="450" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQexample2/pubchart?oid=987654321&format=interactive"></iframe>
```

## Example 3: Pie Chart (Square)

```html
<iframe width="500" height="500" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQexample3/pubchart?oid=555555555&format=interactive"></iframe>
```

## Example 4: URL Only (Will use 700x300 default)

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vQexample4/pubchart?oid=111111111&format=interactive
```

## How to Get Your Own Chart Embed Code

1. **Create a chart in Google Sheets**:
   - Open your Google Sheet
   - Insert → Chart
   - Customize your chart

2. **Publish the chart**:
   - Click on the chart
   - Click the three-dots menu (⋮) in the top-right
   - Select "Publish chart"
   - Choose "Embed" tab
   - Click "Publish"

3. **Copy the embed code**:
   - Copy the entire `<iframe>` code
   - Paste it into the Advanced Google Charts app

4. **Customize & Generate**:
   - Choose animation preset
   - Adjust border radius
   - Set background color
   - Copy the generated responsive embed code

## Tips for Creating Charts

### Best Practices

1. **Chart Size**: Use dimensions between 400-1000px width for best results
2. **Aspect Ratio**: Consider common aspect ratios:
   - 16:9 (800x450) - Standard video aspect ratio
   - 4:3 (800x600) - Traditional display
   - 1:1 (500x500) - Square, great for pie charts
   - 3:2 (600x400) - Common photo aspect ratio

3. **Chart Type Considerations**:
   - **Line/Area Charts**: Wider aspect ratios (16:9) work well
   - **Bar Charts**: Depends on number of bars; tall charts work for many bars
   - **Pie Charts**: Square aspect ratios (1:1) are ideal
   - **Scatter Plots**: Square or slightly wide works best

4. **Data Visibility**: Ensure your chart has:
   - Clear labels
   - Readable legend
   - Adequate spacing
   - High contrast colors

### Styling Tips

The responsive embed preserves the original chart exactly as it appears in Google Sheets, so:

1. **Set chart colors in Google Sheets** before publishing
2. **Adjust fonts and sizes** in the Google Sheets chart editor
3. **Use our app** to add:
   - Border radius (rounded corners)
   - Background color around the chart
   - Animation effects
   - Responsive scaling

### Testing Your Embed

After generating your embed code:

1. **Test on different screen sizes**:
   - Desktop (1920px+)
   - Tablet (768px-1024px)
   - Mobile (320px-767px)

2. **Check in different browsers**:
   - Chrome/Edge (Chromium)
   - Safari
   - Firefox

3. **Verify animation**:
   - Scroll the page to see the animation trigger
   - Check with "reduce motion" enabled (in accessibility settings)

## Real-World Example

Here's a complete workflow:

```markdown
1. You have sales data in Google Sheets
2. Create a bar chart showing monthly sales
3. Publish the chart → Copy iframe code
4. Paste into Advanced Google Charts app
5. Set animation to "Fade Up"
6. Set border radius to 12px
7. Set background to "#f8f9fa"
8. Copy the generated embed code
9. Paste into your Webflow/WordPress site
10. Result: Beautiful, responsive, animated chart! 🎉
```

## Troubleshooting Examples

### Example with Missing Attributes

If you paste:
```html
<iframe src="https://docs.google.com/spreadsheets/d/e/2PACX-example/pubchart"></iframe>
```

The app will:
- ✅ Extract the src URL
- ⚠️ Warn about missing width (uses 700px default)
- ⚠️ Warn about missing height (uses 300px default)
- ✅ Generate working embed code

### Example from Non-Google Domain

If you paste:
```html
<iframe width="600" height="400" src="https://example.com/chart"></iframe>
```

The app will:
- ✅ Parse the dimensions
- ⚠️ Warn that it's not from docs.google.com
- ✅ Generate embed code anyway (might work for other iframe sources)

## Advanced Use Cases

### Multiple Charts in One Page

You can embed multiple charts on the same page:

```html
<!-- Chart 1: Sales by Region -->
<div>
  <h2>Sales by Region</h2>
  <!-- Paste first generated embed code here -->
</div>

<!-- Chart 2: Sales by Month -->
<div>
  <h2>Sales by Month</h2>
  <!-- Paste second generated embed code here -->
</div>
```

Each chart will:
- Scale independently
- Animate independently when scrolled into view
- Maintain its own aspect ratio

### Responsive Grid Layout

Create a grid of charts:

```html
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
  <!-- Chart 1 embed code -->
  <!-- Chart 2 embed code -->
  <!-- Chart 3 embed code -->
  <!-- Chart 4 embed code -->
</div>
```

### Custom Container Sizes

Wrap in custom containers:

```html
<div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
  <h1>Q4 Performance Dashboard</h1>
  <!-- Your chart embed code -->
</div>
```

---

**Need more help?** Check the main [README.md](./README.md) for detailed documentation.
