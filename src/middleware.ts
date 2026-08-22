// Package 2A — SSR response-header architecture.
//
// This middleware attaches the Package 2A security-response headers to every
// server-rendered response. It is deliberately minimal: it forwards the request
// to the rest of the pipeline, preserves the original body, status, statusText,
// and existing headers, and then sets each policy header exactly once.
//
// It also declares the UTF-8 charset on HTML responses, which Astro emits
// without one. See src/lib/htmlCharset.ts for why, and for the inputs that are
// deliberately left alone.
//
// It does not:
//   - convert a 404 into a 200 (status/statusText are preserved verbatim);
//   - alter redirects or rewrite routes;
//   - catch and replace platform errors;
//   - log request URLs, query strings, or response bodies.
//
// The broader Content-Security-Policy is emitted in Report-Only mode only. The
// single enforced CSP is limited to frame-ancestors, per the fixed Package 2A
// embedding decision.

import { defineMiddleware } from "astro:middleware";
import { resolveHtmlCharset } from "./lib/htmlCharset";

// Enforced Package 2A response headers.
const ENFORCED_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Content-Security-Policy": "frame-ancestors 'self';"
};

// Broader policy kept in Report-Only mode for Package 2A.
const REPORT_ONLY_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self' https://66a032cb-79af-46cb-82f1-2576f76bae9d.search.ai.cloudflare.com; form-action 'self'; upgrade-insecure-requests;";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  // Set each Package 2A header exactly once, replacing any prior value so the
  // enforced policy is authoritative and never comma-joined.
  for (const [name, value] of Object.entries(ENFORCED_HEADERS)) {
    response.headers.set(name, value);
  }

  response.headers.set("Content-Security-Policy-Report-Only", REPORT_ONLY_CSP);

  // Declare the encoding Astro already used. Only a charset-less text/html
  // response is rewritten; anything else is returned exactly as received.
  const contentType = resolveHtmlCharset(response.headers.get("Content-Type"));
  if (contentType !== null) {
    response.headers.set("Content-Type", contentType);
  }

  return response;
});
