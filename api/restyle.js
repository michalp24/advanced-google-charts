import OpenAI from "openai";
import { File } from "node:buffer";

// Pro plan max for traditional serverless functions. gpt-image-1 generation
// alone can take 30-90s, plus a GPT-4o vision call for structure extraction.
export const config = { maxDuration: 300 };

const TEXT_MODEL  = process.env.OPENAI_TEXT_MODEL  || "gpt-5.5";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

function extForMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}
function readDataUrl(dataUrl, name, idx) {
  const m = String(dataUrl || "").match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!m) return null;
  const mime = m[1].replace("image/jpg", "image/jpeg");
  const safeName = (name || `image-${idx}.${extForMime(mime)}`).replace(/[^a-zA-Z0-9._-]/g, "_");
  return new File([Buffer.from(m[2], "base64")], safeName, { type: mime });
}
function parseJsonFromText(text) {
  try { return JSON.parse(text); } catch {}
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return {};
  try { return JSON.parse(m[0]); } catch { return {}; }
}

async function extractStructure(openai, dataUrl) {
  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    temperature: 0,
    messages: [
      { role: "system", content: "You extract the exact visible text and layout structure from a diagram image. Return valid JSON only. Never invent labels." },
      { role: "user", content: [
        { type: "text", text: `Extract the diagram structure. Return JSON only:
{
  "title": "exact visible title or empty string",
  "subtitle": "exact visible subtitle or empty string",
  "elements": [
    {"id":"e1", "text":"exact visible text", "type":"title|subtitle|group|box|layer|bar|label|note|connector", "parentId": null, "level":0, "x":0, "y":0, "width":0, "height":0}
  ]
}
Use normalized coordinates 0-100. Preserve exact source text only. Do not create Group 1, Group 2, or any generic label. Do not add icons, explanations, or summaries.` },
        { type: "image_url", image_url: { url: dataUrl } }
      ]}
    ]
  });
  return parseJsonFromText(response.choices?.[0]?.message?.content || "{}");
}

function buildPrompt({ structure, palette, customPrompt }) {
  const colors = palette.length
    ? `Use these colors as the diagram palette: ${palette.join(", ")}.`
    : "Use restrained modern presentation colors.";
  return `Redesign the source stack/architecture diagram into a premium, high-quality presentation graphic at 16:9 landscape.

Composition:
- Fill the canvas. Stretch boxes and columns to use the full width; keep margins small (a thin breathing room is fine, but no wide empty bands on the left, right, top, or bottom).
- Keep the same composition, stack direction, groups, hierarchy, and relative layout from the source.
- Apply clean typography, rounded cards, subtle shadows, aligned spacing — modern enterprise product UI styling.
- ${colors}

Theme:
- Match the source's lightness. If the source background is light/white, render light. If the source background is dark, render dark. Do not flip the theme.
- Use any provided reference images for typography weight, card shape, shadow, and spacing cues only — don't copy their background or palette unless they already match the source.

Content rules:
- Do not add any new text, icons, logos, captions, footnotes, badges, watermarks, or explanatory text.
- Do not add generic labels like Group 1, Group 2, Section 1, etc.
- Preserve the source text as closely as possible. If a label is unclear, omit it rather than invent it.
- Preserve the source boxes, groups, hierarchy, and stack structure.

Extracted source structure to preserve:
${JSON.stringify(structure, null, 2)}

User custom prompt:
${customPrompt || "None."}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set on this Vercel project." });
  }
  // Optional shared-secret gate. If STACK_API_TOKEN is set on the Vercel project,
  // every request must carry a matching X-Stack-Token header. If unset, the API
  // is open (useful for local dev). Use a constant-time comparison to avoid leaking
  // the token length via timing.
  const expected = process.env.STACK_API_TOKEN;
  if (expected) {
    const provided = req.headers["x-stack-token"] || "";
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    let mismatch = a.length !== b.length ? 1 : 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) mismatch |= a[i] ^ b[i];
    if (mismatch !== 0) {
      return res.status(401).json({ error: "Invalid or missing passcode." });
    }
  }
  try {
    const { diagramDataUrl, diagramName, styleImages = [], palette = [], customPrompt = "" } = req.body || {};
    if (!diagramDataUrl) return res.status(400).json({ error: "Missing diagramDataUrl" });

    const sourceFile = readDataUrl(diagramDataUrl, diagramName || "source.png", 0);
    if (!sourceFile) return res.status(400).json({ error: "diagramDataUrl must be a valid base64 data URL (png/jpeg/webp)." });

    const safePalette = Array.isArray(palette)
      ? palette.map(v => String(v).trim()).filter(v => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)).slice(0, 16)
      : [];
    const styleFiles = (Array.isArray(styleImages) ? styleImages : [])
      .slice(0, 6)
      .map((s, i) => readDataUrl(s?.dataUrl, s?.name, i + 1))
      .filter(Boolean);

    // Stream keepalive whitespace during the long OpenAI call. Without this, any
    // intermediary (corporate proxy, VPN gateway, browser idle timeout) tends to
    // drop the connection after 30-60s of silence — surfacing as "Failed to fetch"
    // even though our function is still running. JSON allows leading whitespace,
    // so the final body remains parseable.
    res.status(200);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();
    res.write(" ");
    // 3s interval (was 5s) — corporate proxies often drop connections after
    // ~30s of effective silence even with keepalive bytes; tighter cadence
    // is cheap insurance.
    let keepalive = setInterval(() => { try { res.write(" "); } catch {} }, 3000);
    const stopKeepalive = () => { if (keepalive) { clearInterval(keepalive); keepalive = null; } };

    try {
      const openai = new OpenAI({ apiKey, timeout: 240 * 1000, maxRetries: 0 });
      const t0 = Date.now();
      console.log(`[restyle] start (${sourceFile.size}B source, ${styleFiles.length} refs, ${safePalette.length} colors)`);
      const structure = await extractStructure(openai, diagramDataUrl);
      console.log(`[restyle] structure extracted at ${Date.now() - t0}ms`);
      const prompt = buildPrompt({ structure, palette: safePalette, customPrompt: String(customPrompt || "") });
      const result = await openai.images.edit({
        model: IMAGE_MODEL,
        image: [sourceFile, ...styleFiles],
        prompt,
        size: "1536x1024",
        quality: "high",
      });
      console.log(`[restyle] image generated at ${Date.now() - t0}ms`);
      const b64 = result.data?.[0]?.b64_json;
      stopKeepalive();
      if (!b64) {
        res.end(JSON.stringify({ error: "No image returned by image model." }));
        return;
      }
      const payload = JSON.stringify({ ok: true, mimeType: "image/png", imageBase64: b64, structure });
      console.log(`[restyle] response size: ${(payload.length / 1024 / 1024).toFixed(2)} MB`);
      res.end(payload);
    } catch (innerErr) {
      stopKeepalive();
      console.error("restyle inner error:", innerErr);
      try { res.end(JSON.stringify({ error: innerErr.message || "Unknown error" })); } catch {}
    }
  } catch (err) {
    console.error("restyle outer error:", err);
    if (res.headersSent) {
      try { res.end(JSON.stringify({ error: err.message || "Unknown error" })); } catch {}
    } else {
      res.status(err.status || 500).json({ error: err.message || "Unknown error" });
    }
  }
}
