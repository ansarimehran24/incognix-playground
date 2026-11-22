import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { scan, redact, restore, createEngine } from "incognix-core";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 3000);
const engine = createEngine({ country: "IN" });

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100_000) throw new Error("Request body is too large.");
  }
  return JSON.parse(body || "{}");
}

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "POST" && url.pathname === "/api/scan") {
      const { text } = await readJson(req);
      const result = engine.scan(text);
      return send(res, 200, result);
    }

    if (req.method === "POST" && url.pathname === "/api/redact") {
      const { text } = await readJson(req);
      const result = engine.redact(text);
      return send(res, 200, result);
    }

    if (req.method === "POST" && url.pathname === "/api/restore") {
      const { redactedText, tokens } = await readJson(req);
      const restoredText = restore(redactedText, tokens);
      return send(res, 200, { restoredText });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, { error: "Method not allowed." });
    }

    const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
    const path = join(publicDir, safePath);
    if (!path.startsWith(publicDir)) return send(res, 403, { error: "Forbidden." });

    const content = await readFile(path);
    const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
    res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 500;
    send(res, status, { error: status === 400 ? "Invalid JSON request." : (error.message || "Something went wrong.") });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`INCOGNIX Playground running at http://localhost:${port}`);
});
