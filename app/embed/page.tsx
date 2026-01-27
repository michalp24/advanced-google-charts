"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { decodeConfigClient } from "@/lib/encoding";
import { GoogleEmbedConfig } from "@/lib/types";

/**
 * Embed page component wrapped in Suspense
 * Renders a chart based on encoded config in URL query param
 * Can be used standalone or as iframe src
 */
function EmbedContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<GoogleEmbedConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = searchParams.get("c");
    if (!encoded) {
      setError("Missing config parameter 'c' in URL");
      return;
    }

    try {
      const decoded = decodeConfigClient(encoded);
      if (decoded.mode !== "google-embed") {
        setError(`Unsupported mode: ${decoded.mode}`);
        return;
      }
      setConfig(decoded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decode config");
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nvidia-black p-4">
        <div className="bg-nvidia-gray-dark rounded-lg shadow-lg border border-nvidia-gray-light p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-500 mb-2">Error</h2>
          <p className="text-sm text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nvidia-black">
        <div className="text-nvidia-green">Loading...</div>
      </div>
    );
  }

  return <EmbedRenderer config={config} />;
}

/**
 * Renders the actual embed with responsive scaling and animation
 */
function EmbedRenderer({ config }: { config: GoogleEmbedConfig }) {
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(1);
  
  const { src, baseWidth, baseHeight, animate, frame } = config;
  const aspectRatio = baseWidth / baseHeight;
  const wrapperId = `gs-chart-${Math.random().toString(36).substr(2, 9)}`;
  
  // Provide defaults for optional frame properties
  const borderColor = frame.borderColor || "#76B900";
  const borderWidth = frame.borderWidth || 0;
  const borderRadius = frame.radiusPx || 0;

  useEffect(() => {
    const wrapper = document.getElementById(wrapperId);
    const stage = wrapper?.querySelector(".gs-chart-stage") as HTMLElement;
    if (!wrapper || !stage) return;

    // Responsive scaling
    function updateScale() {
      if (!wrapper || !stage) return;
      const containerWidth = wrapper.offsetWidth;
      const containerHeight = wrapper.offsetHeight;
      const newScale = Math.min(
        containerWidth / baseWidth,
        containerHeight / baseHeight
      );
      setScale(newScale);
    }

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(wrapper);

    // Animation on viewport entry
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
    } else {
      // Small delay to ensure element is rendered before checking intersection
      setTimeout(() => {
        const intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setIsVisible(true);
                intersectionObserver.unobserve(wrapper);
              }
            });
          },
          { threshold: 0.1 }
        );

        // Check if already in viewport
        const rect = wrapper.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport) {
          setIsVisible(true);
        } else {
          intersectionObserver.observe(wrapper);
        }

        return () => {
          intersectionObserver.disconnect();
        };
      }, 100);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [wrapperId, baseWidth, baseHeight]);

  const getAnimationStyles = () => {
    if (!isVisible) {
      switch (animate.preset) {
        case "fade-up":
          return "opacity-0 translate-y-5";
        case "fade":
          return "opacity-0";
        case "pop":
          return "opacity-0 scale-95";
        case "reveal":
          return "opacity-0 translate-y-2 scale-[0.98]";
        default:
          return "opacity-0 translate-y-5";
      }
    }
    return "opacity-100 translate-y-0 scale-100";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nvidia-black p-4">
      <div
        id={wrapperId}
        className={`relative w-full overflow-hidden transition-all ease-out ${getAnimationStyles()}`}
        style={{
          aspectRatio: `${aspectRatio}`,
          borderRadius: `${borderRadius}px`,
          border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
          maxWidth: `${baseWidth}px`,
          transitionDuration: `${animate.durationMs}ms`,
        }}
      >
        <div
          className="gs-chart-stage absolute inset-0"
          style={{
            transformOrigin: "0 0",
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            src={src}
            width={baseWidth}
            height={baseHeight}
            frameBorder="0"
            scrolling="no"
            style={{ border: 0, display: "block" }}
            title="Google Sheets Chart"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Main page component with Suspense boundary
 */
export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-nvidia-black">
          <div className="text-nvidia-green">Loading...</div>
        </div>
      }
    >
      <EmbedContent />
    </Suspense>
  );
}
