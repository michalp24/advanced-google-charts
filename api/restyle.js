import OpenAI from "openai";
import { File } from "node:buffer";

// maxDuration is set in vercel.json (functions.api/restyle.js.maxDuration: 300).
// Plan caps maxDuration at 300s on this project.

const TEXT_MODEL  = process.env.OPENAI_TEXT_MODEL  || "gpt-4o";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
// SVG generation needs the strongest available vision+text model, since the
// task is "look at this raster and reproduce it as vector primitives". Falls
// back through OPENAI_SVG_MODEL → OPENAI_TEXT_MODEL → gpt-5 default.
const SVG_MODEL   = process.env.OPENAI_SVG_MODEL   || process.env.OPENAI_TEXT_MODEL || "gpt-5";

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

// Strip ```svg fences / commentary and return just the <svg>...</svg> body.
function extractSvgMarkup(text) {
  if (!text) return null;
  let s = String(text).replace(/^```(?:svg|xml)?\s*/im, "").replace(/```\s*$/m, "").trim();
  const m = s.match(/<svg[\s\S]*<\/svg>/i);
  return m ? m[0] : null;
}

// Third AI call: regenerate the diagram as editable SVG matching the rendered
// raster. Tuned to mirror what users get from ChatGPT for image→SVG tasks:
// - simple, high-trust prompt (let the model's defaults do the heavy lifting)
// - detail:"high" on the image so the vision pipeline allocates real tokens
// - reasoning_effort:"high" to spend thinking budget on layout/colors before
//   emitting markup. Falls back gracefully on models that don't accept either.
async function generateEditableSvg(openaiSvg, base64Png, structure, palette) {
  const colorHint = palette.length
    ? `If your palette choices need adjusting, prefer these brand colors: ${palette.join(", ")}.`
    : "";

  const userText = `Convert this image into a single editable SVG. The rendered SVG must look like the image — same layout, same colors, same shapes, same text in the same positions.

Output requirements:
- Single <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">…</svg>.
- Use vector primitives only: <rect>, <text>, <g>, <defs>, <linearGradient>, <filter>, <feDropShadow>, etc.
- Every visible text label is a real <text> element (font-family="Inter, system-ui, sans-serif"). Never paths, never <image>, never base64 raster data.
- Reproduce gradients with <linearGradient>, shadows with <filter><feDropShadow/></filter>.
- Match colors precisely; use exact hex values you observe.
- Match the source's lightness — don't flip light↔dark.
- ${colorHint}

Output ONLY the <svg>…</svg> markup. No prose, no fences, no commentary.

Structure cross-reference (text labels + rough normalized 0-100 positions, source of truth is the image itself):
${JSON.stringify(structure)}`;

  // Some newer models use max_completion_tokens; older ones use max_tokens.
  // Both are accepted on most modern endpoints; pass max_completion_tokens
  // (the newer canonical name) and let the SDK route appropriately.
  const reqBody = {
    model: SVG_MODEL,
    max_completion_tokens: 16000,
    messages: [
      { role: "system", content: "You are an expert SVG illustrator. You convert images into editable SVG markup that visually matches the source image. You output only the <svg>…</svg> markup — no prose, no code fences, no commentary." },
      { role: "user", content: [
        { type: "text", text: userText },
        // detail:"high" makes the vision pipeline spend more tokens analyzing
        // the image — closer to what ChatGPT does interactively.
        { type: "image_url", image_url: { url: `data:image/png;base64,${base64Png}`, detail: "high" } }
      ]}
    ],
  };
  // reasoning_effort is supported on gpt-5 family / o-series; harmless extra
  // field for models that ignore it. Wrap in try so a 400 from a non-reasoning
  // model doesn't kill the whole call — we retry without it.
  let response;
  try {
    response = await openaiSvg.chat.completions.create({ ...reqBody, reasoning_effort: "high" });
  } catch (e) {
    if (/reasoning_effort|max_completion_tokens|unknown parameter|unsupported/i.test(String(e?.message || ""))) {
      // Fall back: drop reasoning_effort and use legacy max_tokens
      const legacy = { ...reqBody };
      delete legacy.max_completion_tokens;
      legacy.max_tokens = 16000;
      response = await openaiSvg.chat.completions.create(legacy);
    } else {
      throw e;
    }
  }
  const raw = response.choices?.[0]?.message?.content || "";
  return extractSvgMarkup(raw);
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
  return `Redesign the source stack/architecture diagram into a premium presentation graphic. Render natively at a wide 16:9 landscape canvas (1536x1024).

Canvas usage — IMPORTANT:
- This is a fresh 16:9 canvas. Design FOR this aspect ratio. Do NOT preserve the source image's aspect ratio if it is narrower (e.g. 4:3, square, portrait) — instead, widen and re-flow the diagram to use the full canvas width.
- The leftmost diagram element (column, group, box, or layer) should begin at roughly 4–8% from the left edge (≈60–125px).
- The rightmost diagram element should reach roughly 92–96% across (≈1410–1475px right edge).
- Top and bottom: 5–10% breathing room is fine.
- Stretch column/group/box widths so the stack covers the full available width. Do not letterbox or pillarbox; do not leave wide empty bands.

Composition:
- Keep the same composition, stack direction, groups, hierarchy, and relative layout from the source — but adjust horizontal proportions so it fills the wider canvas.
- Apply clean typography, rounded cards, subtle shadows, aligned spacing — modern enterprise product UI styling.
- ${colors}

Theme:
- Match the source's lightness. If the source background is light/white, render light. If the source background is dark, render dark. Do not flip the theme.
- Use any provided reference images for typography weight, card shape, shadow, and spacing cues only — don't copy their background color or palette unless they already match the source.

Content rules:
- Do not add any new text, icons, logos, captions, footnotes, badges, watermarks, or explanatory text.
- Do not add generic labels like Group 1, Group 2, Section 1, etc.
- Preserve the source text as closely as possible. If a label is unclear, omit it rather than invent it.
- Preserve the source boxes, groups, hierarchy, and stack structure (just re-flowed wider).

Extracted source structure to preserve:
${JSON.stringify(structure, null, 2)}

User custom prompt:
${customPrompt || "None."}`;
}

// Legacy Node-style (req, res) handler — this is the signature vanilla
// /api/*.js files on Vercel are designed for. Streams keepalive whitespace
// during the long OpenAI call so any intermediary keeps the connection warm;
// JSON allows leading whitespace, so the final body remains parseable.
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
  // every request must carry a matching X-Stack-Token header (constant-time compare).
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

    res.status(200);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();
    res.write(" ");
    let keepalive = setInterval(() => { try { res.write(" "); } catch {} }, 3000);
    const stopKeepalive = () => { if (keepalive) { clearInterval(keepalive); keepalive = null; } };

    const t0 = Date.now();
    const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
    try {
      const openai    = new OpenAI({ apiKey, timeout: 270 * 1000, maxRetries: 0 });
      // Separate client with a tighter per-call timeout for the SVG step so a
      // slow SVG model can't consume the rest of the function budget.
      const openaiSvg = new OpenAI({ apiKey, timeout: 120 * 1000, maxRetries: 0 });
      console.log(`[restyle] start  text=${TEXT_MODEL}  svg=${SVG_MODEL}  image=${IMAGE_MODEL}  src=${sourceFile.size}B  refs=${styleFiles.length}  colors=${safePalette.length}`);

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
        // "high" matches the version you confirmed working. medium was an
        // experiment to reduce payload size that may have hurt fidelity.
        quality: "high",
      });
      console.log(`[restyle] image-call:end (${elapsed()})`);

      const b64 = result.data?.[0]?.b64_json;
      if (!b64) {
        stopKeepalive();
        res.end(JSON.stringify({ error: "No image returned by image model." }));
        return;
      }

      // Third call: produce an editable SVG that visually matches the rendered
      // PNG. Wrapped in its own try so a failure here does NOT block the user
      // from getting the raster output — they just won't have an editable SVG.
      let editableSvg = null;
      try {
        console.log(`[restyle] svg-call:start (${elapsed()})  model=${SVG_MODEL}`);
        editableSvg = await generateEditableSvg(openaiSvg, b64, structure, safePalette);
        console.log(`[restyle] svg-call:end (${elapsed()})  svgLen=${editableSvg?.length || 0}`);
      } catch (svgErr) {
        console.warn(`[restyle] svg-call FAILED at ${elapsed()}:`, svgErr.message);
      }

      stopKeepalive();
      const payload = JSON.stringify({
        ok: true,
        mimeType: "image/png",
        imageBase64: b64,
        structure,
        editableSvg,
      });
      console.log(`[restyle] write  size=${(payload.length / 1024 / 1024).toFixed(2)}MB at ${elapsed()}`);
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
