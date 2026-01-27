import { GoogleEmbedConfig, GoogleChartsConfig } from "./types";

/**
 * Generate the embed snippet HTML with inline CSS and JS
 * This snippet is fully self-contained and works on any site
 */
export function generateEmbedSnippet(config: GoogleEmbedConfig): string {
  const {
    src,
    baseWidth,
    baseHeight,
    animate,
    frame,
  } = config;

  const wrapperId = `gs-chart-${Math.random().toString(36).substr(2, 9)}`;
  const aspectRatio = baseWidth / baseHeight;

  // Animation styles based on preset
  const animationStyles = getAnimationStyles(animate.preset);

  // Escape quotes in src
  const escapedSrc = src.replace(/"/g, "&quot;");
  const borderStyle = frame.borderWidth > 0 ? `border: ${frame.borderWidth}px solid ${frame.borderColor};` : '';

  return `<!-- Google Sheets Chart Embed - Responsive & Animated -->
<div id="${wrapperId}" class="gs-chart-wrapper" style="
  position: relative;
  width: 100%;
  max-width: ${baseWidth}px;
  aspect-ratio: ${aspectRatio};
  overflow: hidden;
  border-radius: ${frame.radiusPx}px;
  ${borderStyle}
  opacity: 0;
  ${animationStyles.initial}
  transition: opacity ${animate.durationMs}ms ease-out, transform ${animate.durationMs}ms ease-out;
">
  <div class="gs-chart-stage" style="
    position: absolute;
    inset: 0;
    transform-origin: 0 0;
  ">
    <iframe
      src="${escapedSrc}"
      width="${baseWidth}"
      height="${baseHeight}"
      frameborder="0"
      scrolling="no"
      style="border: 0; display: block;"
    ></iframe>
  </div>
</div>

<script>
(function() {
  // Prefers reduced motion check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const wrapper = document.getElementById('${wrapperId}');
  if (!wrapper) return;
  
  const stage = wrapper.querySelector('.gs-chart-stage');
  if (!stage) return;

  const baseWidth = ${baseWidth};
  const baseHeight = ${baseHeight};

  // Responsive scaling with ResizeObserver
  function updateScale() {
    const containerWidth = wrapper.offsetWidth;
    const containerHeight = wrapper.offsetHeight;
    const scale = Math.min(
      containerWidth / baseWidth,
      containerHeight / baseHeight
    );
    stage.style.transform = 'scale(' + scale + ')';
  }

  // Initial scale
  updateScale();

  // Watch for container size changes
  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(wrapper);
  } else {
    // Fallback for older browsers
    window.addEventListener('resize', updateScale);
  }

  // Animation on viewport entry
  if (!prefersReducedMotion) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          wrapper.style.opacity = '1';
          wrapper.style.transform = 'translateY(0) scale(1)';
          observer.unobserve(wrapper);
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(wrapper);
  } else {
    // Skip animation if reduced motion preferred
    wrapper.style.opacity = '1';
    wrapper.style.transform = 'none';
  }
})();
</script>`;
}

/**
 * Generate the embed snippet for Google Charts
 * This snippet is fully self-contained and works on any site
 */
export function generateGoogleChartsSnippet(config: GoogleChartsConfig): string {
  const wrapperId = `gc-chart-${Math.random().toString(36).substr(2, 9)}`;
  
  // Animation styles based on preset
  const animationStyles = getAnimationStyles(config.animate.preset);
  const borderStyle = config.frame.borderWidth > 0 
    ? `border: ${config.frame.borderWidth}px solid ${config.frame.borderColor};` 
    : '';

  // Prepare data as JSON string
  const dataJson = JSON.stringify(config.dataSource.data);
  const optionsJson = JSON.stringify(config.options);

  return `<!-- Google Charts - Responsive & Animated -->
<div id="${wrapperId}" class="gc-chart-wrapper" style="
  position: relative;
  width: 100%;
  max-width: ${config.options.width || 800}px;
  border-radius: ${config.frame.radiusPx}px;
  ${borderStyle}
  opacity: 0;
  ${animationStyles.initial}
  transition: opacity ${config.animate.durationMs}ms ease-out, transform ${config.animate.durationMs}ms ease-out;
"></div>

<script src="https://www.gstatic.com/charts/loader.js"></script>
<script>
(function() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrapper = document.getElementById('${wrapperId}');
  if (!wrapper) return;

  const chartData = ${dataJson};
  const chartOptions = ${optionsJson};

  // Load Google Charts
  google.charts.load('current', { packages: ['corechart', 'table'] });
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
    const data = google.visualization.arrayToDataTable(chartData);
    
    // Add animation options
    chartOptions.animation = {
      startup: true,
      duration: ${config.animate.durationMs},
      easing: 'out'
    };

    const chart = new google.visualization.${config.chartType}(wrapper);
    chart.draw(data, chartOptions);

    // Trigger entrance animation
    if (!prefersReducedMotion) {
      setTimeout(function() {
        const observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              wrapper.style.opacity = '1';
              wrapper.style.transform = 'translateY(0) scale(1)';
              observer.unobserve(wrapper);
            }
          });
        }, { threshold: 0.1 });
        
        observer.observe(wrapper);
      }, 100);
    } else {
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'none';
    }
  }

  // Responsive resize
  window.addEventListener('resize', function() {
    google.charts.setOnLoadCallback(drawChart);
  });
})();
</script>`;
}

/**
 * Get initial CSS transform based on animation preset
 */
function getAnimationStyles(preset: string): { initial: string } {
  switch (preset) {
    case "fade-up":
      return { initial: "transform: translateY(20px);" };
    case "fade":
      return { initial: "" };
    case "pop":
      return { initial: "transform: scale(0.95);" };
    case "reveal":
      return { initial: "transform: translateY(10px) scale(0.98);" };
    default:
      return { initial: "transform: translateY(20px);" };
  }
}
