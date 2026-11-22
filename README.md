# INCOGNIX Playground

A small web demo powered by the real [`incognix-core`](https://github.com/harshmaurya140-tech/incognix-core) package.

## What it demonstrates

- `scan()` to detect supported sensitive patterns and calculate risk.
- `redact()` to replace detected values with reversible tokens.
- `restore()` to restore the original text using the token map returned by `redact()`.
- `createEngine()` to configure a reusable engine (this demo sets the default phone country to `IN`).

## Requirements

- Node.js 20 or newer
- Internet access for the first dependency installation (the package is installed from GitHub)

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000.

## How the package is used

The backend imports the package directly:

```js
import { scan, redact, restore, createEngine } from "incognix-core";
```

The browser UI calls the demo's Node.js endpoints. It does not reimplement detection in the browser.

## Deploy

Push this folder to a separate GitHub repository, then create a Node Web Service on Render.

- Build command: `npm install`
- Start command: `npm start`

The server listens on `process.env.PORT` and `0.0.0.0`, as required by common Node hosting platforms.

## Privacy note

When run locally, requests are processed by the local Node process. If deployed publicly, text entered into the demo is sent to the hosting provider's server to be processed by this demo. Do not enter real personal information, passwords, API keys, or payment data. Use fictional sample values only. This demo does not call an AI model or send text to an external AI provider.

## Limitations

INCOGNIX detection is pattern-based and can miss sensitive information or produce false positives. A clean scan is not proof that text contains no secrets. The token map is held in the server process only for the request flow in the browser session; this demo is intended for demonstration, not production multi-user use.
