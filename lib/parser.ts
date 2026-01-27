import { ParseResult, GoogleEmbedConfig } from "./types";

/**
 * Parse user-provided iframe embed code or URL
 * Extracts src, width, height safely without executing HTML
 */
export function parseIframeInput(input: string): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  input = input.trim();
  
  if (!input) {
    return {
      success: false,
      errors: ["Input is empty"],
      warnings,
    };
  }

  // Check if input looks like a URL only
  const urlPattern = /^https?:\/\//i;
  if (urlPattern.test(input) && !input.includes("<")) {
    // User provided just a URL
    warnings.push("URL-only input detected. Using default dimensions (700x300). Please provide full iframe code for accurate dimensions.");
    
    if (!input.includes("docs.google.com")) {
      warnings.push("URL does not appear to be from docs.google.com. Ensure it's a valid Google Sheets published chart URL.");
    }
    
    return {
      success: true,
      config: {
        mode: "google-embed" as const,
        src: input,
        baseWidth: 700,
        baseHeight: 300,
        animate: {
          preset: "fade-up" as const,
          durationMs: 600,
        },
        frame: {
          radiusPx: 0,
        },
      },
      warnings,
      errors,
    };
  }

  // Parse as iframe HTML
  try {
    // Use DOMParser in a safe way (client-side) or regex extraction (server-side)
    // For server-side safety, we'll use regex
    const iframeMatch = input.match(/<iframe[^>]*>/i);
    
    if (!iframeMatch) {
      errors.push("No <iframe> tag found in input. Please paste the full iframe embed code or just the URL.");
      return { success: false, warnings, errors };
    }

    const iframeTag = iframeMatch[0];

    // Extract src
    const srcMatch = iframeTag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) {
      errors.push("No src attribute found in iframe tag.");
      return { success: false, warnings, errors };
    }
    const src = srcMatch[1];

    // Extract width
    const widthMatch = iframeTag.match(/width=["']?([0-9.]+)["']?/i);
    const width = widthMatch ? parseFloat(widthMatch[1]) : 700;
    if (!widthMatch) {
      warnings.push(`No width attribute found, defaulting to ${width}px.`);
    }

    // Extract height
    const heightMatch = iframeTag.match(/height=["']?([0-9.]+)["']?/i);
    const height = heightMatch ? parseFloat(heightMatch[1]) : 300;
    if (!heightMatch) {
      warnings.push(`No height attribute found, defaulting to ${height}px.`);
    }

    // Validate src is from Google
    if (!src.includes("docs.google.com")) {
      warnings.push("The src URL does not appear to be from docs.google.com. This may not work as expected.");
    }

    return {
      success: true,
      config: {
        mode: "google-embed" as const,
        src,
        baseWidth: width,
        baseHeight: height,
        animate: {
          preset: "fade-up" as const,
          durationMs: 600,
        },
        frame: {
          radiusPx: 0,
        },
      },
      warnings,
      errors,
    };
  } catch (error) {
    errors.push(`Parse error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { success: false, warnings, errors };
  }
}
