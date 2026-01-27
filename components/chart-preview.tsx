"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleEmbedConfig } from "@/lib/types";

interface ChartPreviewProps {
  config: GoogleEmbedConfig;
  className?: string;
}

/**
 * Client-side preview component that demonstrates the responsive scaling
 * Uses the same logic that will be in the generated snippet
 */
export function ChartPreview({ config, className = "" }: ChartPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { src, baseWidth, baseHeight, animate, frame } = config;
  const aspectRatio = baseWidth / baseHeight;

  // Responsive scaling with ResizeObserver
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    if (!wrapper || !stage) return;

    function updateScale() {
      if (!wrapper || !stage) return;
      const containerWidth = wrapper.offsetWidth;
      const containerHeight = wrapper.offsetHeight;
      const scale = Math.min(
        containerWidth / baseWidth,
        containerHeight / baseHeight
      );
      stage.style.transform = `scale(${scale})`;
    }

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
    };
  }, [baseWidth, baseHeight]);

  // Animation on viewport entry
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(wrapper);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
    };
  }, []);

  const getAnimationClasses = () => {
    const base = `transition-all ease-out`;
    if (!isVisible) {
      switch (animate.preset) {
        case "fade-up":
          return `${base} opacity-0 translate-y-5`;
        case "fade":
          return `${base} opacity-0`;
        case "pop":
          return `${base} opacity-0 scale-95`;
        case "reveal":
          return `${base} opacity-0 translate-y-2 scale-[0.98]`;
        default:
          return `${base} opacity-0 translate-y-5`;
      }
    }
    return `${base} opacity-100 translate-y-0 scale-100`;
  };

  const animationDuration = `${animate.durationMs}ms`;

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full overflow-hidden ${getAnimationClasses()} ${className}`}
      style={{
        aspectRatio: `${aspectRatio}`,
        borderRadius: `${frame.radiusPx}px`,
        backgroundColor: frame.backgroundColor || "transparent",
        maxWidth: `${baseWidth}px`,
        transitionDuration: animationDuration,
      }}
    >
      <div
        ref={stageRef}
        className="absolute inset-0"
        style={{
          transformOrigin: "0 0",
        }}
      >
        <iframe
          src={src}
          width={baseWidth}
          height={baseHeight}
          frameBorder="0"
          scrolling="no"
          style={{ border: 0, display: "block" }}
          title="Google Sheets Chart Preview"
        />
      </div>
    </div>
  );
}
