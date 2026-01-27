import { RenderConfig, RenderConfigSchema } from "./types";

/**
 * Encode config to base64url for URL sharing
 */
export function encodeConfig(config: RenderConfig): string {
  const json = JSON.stringify(config);
  // Convert to base64url (URL-safe base64)
  const base64 = Buffer.from(json, "utf-8").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Decode base64url config from URL
 */
export function decodeConfig(encoded: string): RenderConfig {
  try {
    // Convert base64url to standard base64
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const data = JSON.parse(json);
    
    // Validate with Zod
    return RenderConfigSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid config: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Client-side version of encode (for browser)
 */
export function encodeConfigClient(config: RenderConfig): string {
  const json = JSON.stringify(config);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Client-side version of decode (for browser)
 */
export function decodeConfigClient(encoded: string): RenderConfig {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const json = decodeURIComponent(escape(atob(base64)));
    const data = JSON.parse(json);
    return RenderConfigSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid config: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
