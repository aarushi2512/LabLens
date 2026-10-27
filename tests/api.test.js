const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");

const PORT = 3101;
const BASE = `http://localhost:${PORT}`;
let server;

function dataUrl(text) { return `data:text/plain;base64,${Buffer.from(text).toString("base64")}`; }
async function waitForServer() { for (let i = 0; i < 30; i++) { try { const response = await fetch(BASE); if (response.ok) return; } catch {} await new Promise(resolve => setTimeout(resolve, 200)); } throw new Error("Test server did not start."); }

test.before(async () => { server = spawn(process.execPath, ["server.js"], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" }); await waitForServer(); });
test.after(() => server?.kill());

test("serves the website and favicon without 404 noise", async () => {
  assert.equal((await fetch(BASE)).status, 200);
  assert.equal((await fetch(`${BASE}/favicon.ico`)).status, 204);
});

test("rejects unsupported files before calling OpenRouter", async () => {
  const response = await fetch(`${BASE}/api/analyze-report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "bad.exe", type: "application/octet-stream", data: dataUrl("not a report"), provider: "openrouter" }) });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Unsupported file type/);
});

test("uses the configured OpenRouter key and extracts report values", async () => {
  assert.ok(process.env.OPENROUTER_API_KEY || require("node:fs").readFileSync(".env", "utf8").match(/^OPENROUTER_API_KEY=.+$/m), "OPENROUTER_API_KEY is not configured");
  const response = await fetch(`${BASE}/api/analyze-report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "synthetic-report.txt", type: "text/plain", data: dataUrl("Hemoglobin 12.5 g/dL\nGlucose 108 mg/dL"), provider: "openrouter" }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.report.provider, "OpenRouter");
  assert.equal(body.report.values.hb, 12.5);
  assert.equal(body.report.values.glucose, 108);
});
