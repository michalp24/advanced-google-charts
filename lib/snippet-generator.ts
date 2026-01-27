import { GoogleEmbedConfig } from "./types";

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

  // Escape quotes in src and background color
  const escapedSrc = src.replace(/"/g, "&quot;");
  const bgColor = frame.backgroundColor || "transparent";

  return `<!-- Google Sheets Chart Embed - Responsive & Animated -->
<div id="${wrapperId}" class="gs-chart-wrapper" style="
  position: relative;
  width: 100%;
  max-width: ${baseWidth}px;
  aspect-ratio: ${aspectRatio};
  overflow: hidden;
  border-radius: ${frame.radiusPx}px;
  background-color: ${bgColor};
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
