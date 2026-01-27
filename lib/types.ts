import { z } from "zod";

/**
 * Renderer mode types - V1 supports google-embed, V2+ will add echarts
 */
export type RendererMode = "google-embed" | "echarts";

/**
 * Animation presets for viewport reveal
 */
export const AnimationPreset = z.enum(["fade-up", "fade", "pop", "reveal"]);
export type AnimationPreset = z.infer<typeof AnimationPreset>;

/**
 * Base configuration shared by all renderer modes
 */
export const RenderConfigBaseSchema = z.object({
  mode: z.enum(["google-embed", "echarts"]),
  animate: z.object({
    preset: AnimationPreset,
    durationMs: z.number().min(0).max(5000).default(600),
  }),
});

export type RenderConfigBase = z.infer<typeof RenderConfigBaseSchema>;

/**
 * Google Embed specific configuration (V1)
 */
export const GoogleEmbedConfigSchema = RenderConfigBaseSchema.extend({
  mode: z.literal("google-embed"),
  src: z.string().url(),
  baseWidth: z.number().positive(),
  baseHeight: z.number().positive(),
  frame: z.object({
    radiusPx: z.number().min(0).max(24).default(0),
    borderWidth: z.number().min(0).max(8).default(0),
    borderColor: z.string().optional().default("#76B900"),
  }),
});

export type GoogleEmbedConfig = z.infer<typeof GoogleEmbedConfigSchema>;

/**
 * Future: ECharts configuration (V2+)
 * Placeholder for future implementation
 */
export const EChartsConfigSchema = RenderConfigBaseSchema.extend({
  mode: z.literal("echarts"),
  dataSource: z.object({
    type: z.enum(["gviz", "sheets-api"]),
    url: z.string().optional(),
  }),
  // option: z.any(), // EChartsOption - will be properly typed in V2
  // themeTokens: z.record(z.string()).optional(),
});

export type EChartsConfig = z.infer<typeof EChartsConfigSchema>;

/**
 * Union of all renderer configs
 */
export const RenderConfigSchema = z.discriminatedUnion("mode", [
  GoogleEmbedConfigSchema,
  EChartsConfigSchema,
]);

export type RenderConfig = z.infer<typeof RenderConfigSchema>;

/**
 * Result of parsing user input iframe code
 */
export interface ParseResult {
  success: boolean;
  config?: Partial<GoogleEmbedConfig>;
  warnings: string[];
  errors: string[];
}
