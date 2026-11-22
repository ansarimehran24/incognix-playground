const $ = (id) => document.getElementById(id);
let lastTokens = null;
let lastRedacted = "";

const sample = "Hi, I'm Alex. You can reach me at alex@example.com or call +91 9876543210. My test API key is sk-proj-1234567890abcdefghijklmnop. Please review this message.";
$("loadSample").addEventListener("click", () => { $("inputText").value = sample; toast("Sample loaded. These are fictional test values."); });

async function post(path, payload) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
function showReport(result) {
  $("results").hidden = false;
  $("riskScore").textContent = result.risk?.score ?? "—";
  $("riskLevel").textContent = result.risk?.level ?? "—";
  $("findingCount").textContent = result.risk?.totalFindings ?? result.findings?.length ?? 0;
  const findings = result.findings || result.detections || [];
  $("findings").innerHTML = "";
  if (!findings.length) $("findings").innerHTML = '<div class="empty">No supported sensitive patterns were detected in this text.</div>';
  for (const item of findings) {
    const row = document.createElement("div"); row.className = "finding";
    const type = document.createElement("span"); type.className = "finding-type"; type.textContent = item.type || item.category || "MATCH";
    const risk = document.createElement("span"); risk.className = "finding-risk"; risk.textContent = `${item.risk || "unrated"} · ${item.end - item.start} characters`;
    row.append(type, risk); $("findings").append(row);
  }
}
function busy(button, state) { button.disabled = state; button.dataset.label ||= button.textContent; button.textContent = state ? "Processing…" : button.dataset.label; }
$("scanBtn").addEventListener("click", async () => {
  const text = $("inputText").value;
  if (!text.trim()) return toast("Enter some sample text first.");
  busy($("scanBtn"), true);
  try { const result = await post("/api/scan", { text }); showReport(result); $("redactedPanel").hidden = true; }
  catch (e) { toast(e.message); } finally { busy($("scanBtn"), false); }
});
$("redactBtn").addEventListener("click", async () => {
  const text = $("inputText").value;
  if (!text.trim()) return toast("Enter some sample text first.");
  busy($("redactBtn"), true);
  try {
    const result = await post("/api/redact", { text });
    lastTokens = result.tokens; lastRedacted = result.redactedText;
    showReport({ ...result, findings: result.detections });
    $("redactedOutput").textContent = result.redactedText;
    $("redactedPanel").hidden = false; $("restoreResult").hidden = true;
  } catch (e) { toast(e.message); } finally { busy($("redactBtn"), false); }
});
$("copyRedacted").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(lastRedacted); toast("Protected text copied."); } catch { toast("Clipboard access unavailable."); }
});
$("restoreBtn").addEventListener("click", async () => {
  if (!lastTokens) return toast("Redact text first.");
  try {
    const result = await post("/api/restore", { redactedText: lastRedacted, tokens: lastTokens });
    $("restoreResult").textContent = result.restoredText;
    $("restoreResult").hidden = false;
  } catch (e) { toast(e.message); }
});
function toast(message) { const el = $("toast"); el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2400); }
