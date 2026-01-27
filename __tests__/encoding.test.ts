import { encodeConfigClient, decodeConfigClient } from "@/lib/encoding";
import { GoogleEmbedConfig } from "@/lib/types";

describe("Config Encoding/Decoding", () => {
  const sampleConfig: GoogleEmbedConfig = {
    mode: "google-embed",
    src: "https://docs.google.com/spreadsheets/d/test/pubchart?oid=123",
    baseWidth: 600,
    baseHeight: 400,
    animate: {
      preset: "fade-up",
      durationMs: 600,
    },
    frame: {
      radiusPx: 8,
      backgroundColor: "#ffffff",
    },
  };

  it("should encode and decode a config correctly", () => {
    const encoded = encodeConfigClient(sampleConfig);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe("string");
    expect(encoded).not.toContain("+"); // base64url should not have +
    expect(encoded).not.toContain("/"); // base64url should not have /
    expect(encoded).not.toContain("="); // base64url should not have padding

    const decoded = decodeConfigClient(encoded);
    expect(decoded).toEqual(sampleConfig);
  });

  it("should handle config without optional backgroundColor", () => {
    const configWithoutBg: GoogleEmbedConfig = {
      ...sampleConfig,
      frame: {
        radiusPx: 0,
      },
    };

    const encoded = encodeConfigClient(configWithoutBg);
    const decoded = decodeConfigClient(encoded);

    expect(decoded).toEqual(configWithoutBg);
    expect(decoded.frame.backgroundColor).toBeUndefined();
  });

  it("should handle different animation presets", () => {
    const presets = ["fade-up", "fade", "pop", "reveal"] as const;

    presets.forEach((preset) => {
      const config: GoogleEmbedConfig = {
        ...sampleConfig,
        animate: {
          preset,
          durationMs: 800,
        },
      };

      const encoded = encodeConfigClient(config);
      const decoded = decodeConfigClient(encoded);

      expect(decoded.animate.preset).toBe(preset);
      expect(decoded.animate.durationMs).toBe(800);
    });
  });

  it("should throw error for invalid encoded string", () => {
    expect(() => {
      decodeConfigClient("invalid-base64-string");
    }).toThrow();
  });

  it("should throw error for malformed JSON", () => {
    const invalidEncoded = btoa("not valid json");
    expect(() => {
      decodeConfigClient(invalidEncoded);
    }).toThrow();
  });

  it("should validate config schema on decode", () => {
    const invalidConfig = {
      mode: "google-embed",
      // missing required fields
    };

    const encoded = btoa(JSON.stringify(invalidConfig));
    expect(() => {
      decodeConfigClient(encoded);
    }).toThrow();
  });

  it("should handle special characters in src URL", () => {
    const configWithSpecialChars: GoogleEmbedConfig = {
      ...sampleConfig,
      src: "https://docs.google.com/test?param=value&other=123#anchor",
    };

    const encoded = encodeConfigClient(configWithSpecialChars);
    const decoded = decodeConfigClient(encoded);

    expect(decoded.src).toBe(configWithSpecialChars.src);
  });
});
