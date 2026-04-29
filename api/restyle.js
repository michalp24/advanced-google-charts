import OpenAI from "openai";
import { File } from "node:buffer";

// maxDuration is set in vercel.json (functions.api/restyle.js.maxDuration: 800).
// Fluid Compute is enabled on the project.

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

// ── Web-standard handler — Request in, Response (with ReadableStream) out ──
// This is Vercel's recommended pattern for streaming. Headers flush immediately
// and the keepalive bytes go straight to the wire (no buffering surprises).
export default async function handler(request) {
  const json = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", "Allow": "POST" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json(500, { error: "OPENAI_API_KEY is not set on this Vercel project." });

  // Optional shared-secret gate (constant-time compare)
  const expected = process.env.STACK_API_TOKEN;
  if (expected) {
    const provided = request.headers.get("x-stack-token") || "";
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    let mismatch = a.length !== b.length ? 1 : 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) mismatch |= a[i] ^ b[i];
    if (mismatch !== 0) return json(401, { error: "Invalid or missing passcode." });
  }

  let body;
  try { body = await request.json(); }
  catch { return json(400, { error: "Body must be JSON." }); }

  const { diagramDataUrl, diagramName, styleImages = [], palette = [], customPrompt = "" } = body || {};
  if (!diagramDataUrl) return json(400, { error: "Missing diagramDataUrl" });

  const sourceFile = readDataUrl(diagramDataUrl, diagramName || "source.png", 0);
  if (!sourceFile) return json(400, { error: "diagramDataUrl must be a valid base64 data URL (png/jpeg/webp)." });

  const safePalette = Array.isArray(palette)
    ? palette.map(v => String(v).trim()).filter(v => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)).slice(0, 16)
    : [];
  const styleFiles = (Array.isArray(styleImages) ? styleImages : [])
    .slice(0, 6)
    .map((s, i) => readDataUrl(s?.dataUrl, s?.name, i + 1))
    .filter(Boolean);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // First byte goes out immediately so the connection is "active" — no
      // intermediary will see a quiet idle period.
      controller.enqueue(encoder.encode(" "));

      // 2.5s keepalive cadence. JSON parsers ignore leading/inner whitespace,
      // so any number of spaces is harmless before the final JSON object.
      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(" ")); } catch {}
      }, 2500);

      const t0 = Date.now();
      const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
      try {
        const openai = new OpenAI({ apiKey, timeout: 600 * 1000, maxRetries: 0 });
        console.log(`[restyle] start  model=${TEXT_MODEL}  src=${sourceFile.size}B  refs=${styleFiles.length}  colors=${safePalette.length}`);

        console.log(`[restyle] structure-call:start (${elapsed()})`);
        const structure = await extractStructure(openai, diagramDataUrl);
        console.log(`[restyle] structure-call:end (${elapsed()})  elements=${(structure?.elements || []).length}`);

        const prompt = buildPrompt({ structure, palette: safePalette, customPrompt: String(customPrompt || "") });
        console.log(`[restyle] image-call:start (${elapsed()})  promptLen=${prompt.length}`);
        const result = await openai.images.edit({
          model: IMAGE_MODEL,
          image: [sourceFile, ...styleFiles],
          prompt,
          size: "1536x1024",
          quality: "medium",
        });
        console.log(`[restyle] image-call:end (${elapsed()})`);

        clearInterval(keepalive);
        const b64 = result.data?.[0]?.b64_json;
        if (!b64) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "No image returned by image model." })));
          controller.close();
          return;
        }
        const payload = JSON.stringify({ ok: true, mimeType: "image/png", imageBase64: b64, structure });
        console.log(`[restyle] write:start (${elapsed()})  size=${(payload.length / 1024 / 1024).toFixed(2)}MB`);
        controller.enqueue(encoder.encode(payload));
        controller.close();
        console.log(`[restyle] write:end (${elapsed()})`);
      } catch (err) {
        clearInterval(keepalive);
        console.error("restyle error:", err);
        try {
          controller.enqueue(encoder.encode(JSON.stringify({ error: err.message || "Unknown error" })));
        } catch {}
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
