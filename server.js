const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

loadEnv(path.join(__dirname, ".env"));
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const MAX_BODY = 11 * 1024 * 1024;
const MAX_FILE = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt", ".csv", ".json"]);
const REPORT_KEYS = ["age", "hb", "hct", "wbc", "rbc", "mcv", "rdw", "plt", "glucose", "hba1c", "creatinine", "uric_acid", "alt", "ast", "tchol", "hdl", "ldl", "tg", "bmi", "sex"];
const REPORT_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    values: { type: "object", additionalProperties: false, properties: Object.fromEntries(REPORT_KEYS.map(key => [key, key === "sex" ? { type: ["string", "null"], enum: ["male", "female", null] } : { type: ["number", "null"] }])), required: REPORT_KEYS },
    referenceRanges: { type: "object", additionalProperties: false, properties: Object.fromEntries(REPORT_KEYS.map(key => [key, { type: ["string", "null"] }])), required: REPORT_KEYS },
    observations: { type: "array", items: { type: "string" } },
    conclusion: { type: "string" },
    nextSteps: { type: "array", items: { type: "string" } },
  },
  required: ["values", "referenceRanges", "observations", "conclusion", "nextSteps"],
};

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
function json(res, status, body) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); }
function readBody(req) { return new Promise((resolve, reject) => { let size = 0; const chunks = []; req.on("data", chunk => { size += chunk.length; if (size > MAX_BODY) { reject(new Error("Request is too large.")); req.destroy(); return; } chunks.push(chunk); }); req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(new Error("Invalid request body.")); } }); req.on("error", reject); }); }
function decodeDataUrl(data) { const match = String(data || "").match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/s); if (!match) throw new Error("The uploaded file could not be read."); const buffer = Buffer.from(match[2], "base64"); if (buffer.length > MAX_FILE) throw new Error("File is larger than 8 MB."); return { mime: match[1] || "application/octet-stream", buffer, dataUrl: data }; }
function buildPrompt(name, mime, text) { return `You are LabLens, a careful laboratory-report extraction assistant. Read the attached report and return ONLY valid JSON, with no markdown. OCN means Observations, Conclusion, Next steps. Never invent values. Use null for missing values. Preserve the number exactly when clear. Normalize supported measurements into this values object: age, hb, hct, wbc, rbc, mcv, rdw, plt, glucose, hba1c, creatinine, uric_acid, alt, ast, tchol, hdl, ldl, tg, bmi, sex. Use numeric values for measurements and "male"/"female"/null for sex. Include unit-aware values in observations only when explicitly present. Also return referenceRanges as supported-value keys mapped to the exact printed reference interval text, or null when absent. Never infer ranges.

Return a JSON object following the required response schema. Include every supported key; use null for values or ranges that are missing.

Observations should be short factual findings, not diagnoses. Conclusion should be a cautious one-sentence summary. Next steps should be practical and recommend clinician review where appropriate. Report filename: ${name}. MIME type: ${mime}.${text ? `\nExtracted text content:\n${text}` : ""}`; }
function parseJson(text) {
  const raw = Array.isArray(text) ? text.map(part => typeof part === "string" ? part : (part?.text || "")).join("") : (typeof text === "object" && text !== null ? (text.text || JSON.stringify(text)) : String(text || ""));
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  for (let start = cleaned.indexOf("{"); start !== -1; start = cleaned.indexOf("{", start + 1)) {
    let depth = 0, inString = false, escaped = false;
    for (let i = start; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (inString) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') inString = false; continue; }
      if (char === '"') inString = true;
      else if (char === "{") depth++;
      else if (char === "}" && --depth === 0) {
        try { return JSON.parse(cleaned.slice(start, i + 1)); } catch { break; }
      }
    }
  }
  throw new Error("The AI response was not valid JSON. Try again, or use manual entry.");
}
function normalizeReport(report) { const keys = ["age", "hb", "hct", "wbc", "rbc", "mcv", "rdw", "plt", "glucose", "hba1c", "creatinine", "uric_acid", "alt", "ast", "tchol", "hdl", "ldl", "tg", "bmi", "sex"]; const values = {}; for (const key of keys) { const value = report?.values?.[key]; values[key] = key === "sex" ? (value === "male" || value === "female" ? value : null) : (typeof value === "number" && Number.isFinite(value) ? value : null); } const referenceRanges = {}; for (const key of keys) { const range = report?.referenceRanges?.[key]; referenceRanges[key] = typeof range === "string" ? range.slice(0, 80) : null; } return { values, referenceRanges, observations: Array.isArray(report?.observations) ? report.observations.slice(0, 10).map(String) : [], conclusion: String(report?.conclusion || "").slice(0, 1000), nextSteps: Array.isArray(report?.nextSteps) ? report.nextSteps.slice(0, 10).map(String) : [] }; }
function parsePlainTextReport(text) {
  const aliases = {
    age: ["age"], sex: ["sex", "gender"], bmi: ["bmi", "body mass index"],
    hb: ["hb", "hgb", "hemoglobin", "haemoglobin"], hct: ["hct", "hematocrit", "haematocrit"],
    wbc: ["wbc", "white blood cell count", "white blood cells"], rbc: ["rbc", "red blood cell count", "red blood cells"],
    mcv: ["mcv"], rdw: ["rdw"], plt: ["plt", "platelets", "platelet count"],
    glucose: ["glucose", "fasting glucose", "blood glucose"], hba1c: ["hba1c", "a1c", "hemoglobin a1c", "haemoglobin a1c"],
    creatinine: ["creatinine", "serum creatinine"], uric_acid: ["uric acid"],
    alt: ["alt", "sgpt", "alt sgpt"], ast: ["ast", "sgot", "ast sgot"],
    tchol: ["total cholesterol", "cholesterol"], hdl: ["hdl", "hdl cholesterol"],
    ldl: ["ldl", "ldl cholesterol"], tg: ["triglycerides", "triglyceride", "tg"],
  };
  const canonical = value => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const lookup = new Map(Object.entries(aliases).flatMap(([key, names]) => names.map(name => [canonical(name), key])));
  const values = Object.fromEntries(REPORT_KEYS.map(key => [key, null]));
  const referenceRanges = Object.fromEntries(REPORT_KEYS.map(key => [key, null]));
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split(/[:,\t]/);
    const label = (parts.shift() || "").trim().replace(/\([^)]*\)/g, "").trim();
    const key = lookup.get(canonical(label));
    if (!key) continue;
    const detail = parts.join(" ").trim();
    if (key === "sex") {
      const sex = detail.match(/\b(male|female)\b/i);
      if (sex) values.sex = sex[1].toLowerCase();
      continue;
    }
    const number = detail.match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)/);
    if (number) values[key] = Number(number[0]);
    const range = detail.match(/(?:reference(?:\s+range)?|ref|range)\s*[:=]?\s*([^;]+)/i);
    if (range) referenceRanges[key] = range[1].trim().slice(0, 80);
  }
  if (!REPORT_KEYS.some(key => values[key] !== null)) return null;
  const count = REPORT_KEYS.filter(key => values[key] !== null).length;
  return {
    values, referenceRanges,
    observations: [`${count} values were read from the text report.`],
    conclusion: "Text values were copied for review. Compare them with the original report before screening.",
    nextSteps: ["Check each extracted value and unit against the original report."],
  };
}
async function callProvider(provider, prompt, file) { const useNvidia = provider === "nvidia"; const key = useNvidia ? process.env.NVIDIA_API_KEY : process.env.OPENROUTER_API_KEY; if (!key) throw new Error(useNvidia ? "NVIDIA_API_KEY is not configured." : "OPENROUTER_API_KEY is not configured."); const url = useNvidia ? "https://integrate.api.nvidia.com/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions"; const model = useNvidia ? (process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct") : (process.env.OPENROUTER_MODEL || "openrouter/free"); const content = [{ type: "text", text: prompt }]; if (file.mime.startsWith("image/")) content.push({ type: "image_url", image_url: { url: file.dataUrl } }); else if (file.mime === "application/pdf" && !useNvidia) content.push({ type: "file", file: { filename: "report.pdf", file_data: file.dataUrl } }); const request = { model, temperature: 0.1, max_tokens: 1800, messages: [{ role: "user", content }] }; if (!useNvidia) { request.response_format = { type: "json_schema", json_schema: { name: "lablens_report", strict: true, schema: REPORT_SCHEMA } }; request.provider = { require_parameters: true }; } if (!useNvidia && file.mime === "application/pdf") request.plugins = [{ id: "file-parser", pdf: { engine: "cloudflare-ai" } }]; const headers = { "Content-Type": "application/json", Authorization: `Bearer ${key}` }; if (!useNvidia) { headers["HTTP-Referer"] = "http://localhost:" + PORT; headers["X-Title"] = "LabLens"; } const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(request) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(`${useNvidia ? "NVIDIA" : "OpenRouter"} request failed (${response.status}): ${body?.error?.message || "provider rejected the request"}`); return { report: parseJson(body?.choices?.[0]?.message?.content), provider: useNvidia ? "NVIDIA" : "OpenRouter" }; }
async function analyzeReport(payload) { if (!payload || typeof payload.name !== "string") throw new Error("Choose a report file first."); const ext = path.extname(payload.name).toLowerCase(); if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error("Unsupported file type. Use PDF, image, text, CSV, or JSON."); const file = decodeDataUrl(payload.data); const isText = [".txt", ".csv", ".json"].includes(ext); const text = isText ? file.buffer.toString("utf8").slice(0, 120000) : ""; if (ext === ".txt" || ext === ".csv") { const local = parsePlainTextReport(text); if (local) return { ...normalizeReport(local), provider: "Local text reader" }; } const prompt = buildPrompt(payload.name, file.mime, text); const requested = payload.provider || "auto"; const providers = requested === "auto" ? (process.env.OPENROUTER_API_KEY ? ["openrouter"] : ["nvidia"]) : [requested]; const errors = []; for (const provider of providers) { try { const result = await callProvider(provider, prompt, file); return { ...normalizeReport(result.report), provider: result.provider }; } catch (error) { errors.push(error.message); } } throw new Error(errors.join(" ")); }
function serveStatic(res, pathname) { const requested = pathname === "/" ? "/index.html" : pathname; const file = path.normalize(path.join(ROOT, requested)); if ((file !== ROOT && !file.startsWith(ROOT + path.sep)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return json(res, 404, { error: "Not found." }); const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" }; res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store, no-cache, must-revalidate" }); fs.createReadStream(file).pipe(res); }
http.createServer(async (req, res) => { const url = new URL(req.url, `http://${req.headers.host || "localhost"}`); if (req.method === "GET" && url.pathname === "/favicon.ico") { res.writeHead(204); return res.end(); } if (req.method === "POST" && url.pathname === "/api/analyze-report") { try { json(res, 200, { report: await analyzeReport(await readBody(req)) }); } catch (error) { json(res, 400, { error: error.message }); } return; } if (req.method === "GET") return serveStatic(res, url.pathname); json(res, 405, { error: "Method not allowed." }); }).listen(PORT, () => console.log(`LabLens running at http://localhost:${PORT}`));

