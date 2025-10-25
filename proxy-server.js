// Simple passthrough proxy server
// Forwards any incoming HTTP request to the configured TARGET_ORIGIN while preserving
// path, query, method, headers and streaming the body & response.
//
// Usage:
//   PORT=3300 TARGET_ORIGIN=https://us.cwcloudtest.com pnpm run proxy
//   (defaults shown above)
//
// This file is intentionally dependency‑free (uses core Node modules) so it works
// out-of-the-box in this repo which is ESM ("type": "module").

import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import { pipeline } from 'node:stream';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3300;
const TARGET_ORIGIN = process.env.TARGET_ORIGIN || 'https://us.cwcloudtest.com';
// Serve local Next.js dev server (or built app) beneath a deep prefix inside the proxy.
// Example desired URL (user visible):
//   http://localhost:3300/sdlc-da-dev-mikhail-test/e/eng/UTcJzbmcQ8-WjYKAGYZwpw/aida/*
// Should map internally to: http://localhost:3000/*
// Configuration:
//   LOCAL_APP_PREFIX   - path prefix at which to mount local app (must start with '/')
//   LOCAL_APP_TARGET   - origin of local app (default http://localhost:3000)
//   LOCAL_STRIP_PREFIX - if 'true', strip the prefix when forwarding to local app (default true)
// If not set, LOCAL_APP_PREFIX defaults to value shown above for convenience.
const DEFAULT_LOCAL_PREFIX = '/sdlc-da-dev-mikhail-test/e/eng/6wGiEEm6SoC0ypW1rz6Jyw/aida';
const LOCAL_APP_PREFIX = (process.env.LOCAL_APP_PREFIX || DEFAULT_LOCAL_PREFIX).replace(/\/$/, '');
const LOCAL_APP_TARGET = process.env.LOCAL_APP_TARGET || 'http://localhost:3000';
const LOCAL_STRIP_PREFIX = (process.env.LOCAL_STRIP_PREFIX || 'true').toLowerCase() === 'true';
// If true, also serve Next.js root asset paths (/_next/*, /favicon.ico) from the local app
// so that absolute asset URLs emitted by the page still work without configuring basePath.
const LOCAL_SERVE_NEXT_ASSETS = (process.env.LOCAL_SERVE_NEXT_ASSETS || 'true').toLowerCase() === 'true';
// Local API configuration: route specific API path prefix to a local backend so browser includes
// the same cookies (since request still goes to proxy origin domain/port 3300).
// Env vars:
//   LOCAL_API_PREFIX   - path prefix for API requests (default /api/agent/lc/v1)
//   LOCAL_API_TARGET   - origin of local API server (default http://localhost:3388)
//   LOCAL_API_STRIP    - whether to strip the prefix when forwarding (default false)
//   LOCAL_COOKIE_PATH_REWRITE - if set (e.g. '/') rewrite Path attribute of Set-Cookie for API responses
const LOCAL_API_PREFIX = (process.env.LOCAL_API_PREFIX || '/api/agent/lc/v1').replace(/\/$/, '');
const LOCAL_API_TARGET = process.env.LOCAL_API_TARGET || 'http://localhost:3388';
const LOCAL_API_STRIP = (process.env.LOCAL_API_STRIP || 'false').toLowerCase() === 'true';
const LOCAL_COOKIE_PATH_REWRITE = process.env.LOCAL_COOKIE_PATH_REWRITE || '';
// Generic cookie widening for remote (and any) responses:
//   WIDEN_COOKIE_PREFIX   - if a Set-Cookie has Path that starts with this prefix, rewrite it
//   WIDEN_COOKIE_NEW_PATH - new Path value to apply (default '/')
//   COOKIE_ADD_PATH_IF_MISSING - if 'true', add ; Path=... when no Path present
const WIDEN_COOKIE_PREFIX = (process.env.WIDEN_COOKIE_PREFIX || '').replace(/\/$/, '/');
const WIDEN_COOKIE_NEW_PATH = process.env.WIDEN_COOKIE_NEW_PATH || '/';
const COOKIE_ADD_PATH_IF_MISSING = (process.env.COOKIE_ADD_PATH_IF_MISSING || 'true').toLowerCase() === 'true';
let localApiUrl;
try {
  localApiUrl = new URL(LOCAL_API_TARGET);
} catch (e) {
  console.error('[proxy] Invalid LOCAL_API_TARGET:', LOCAL_API_TARGET, e);
  process.exit(1);
}
let localAppUrl;
try {
  localAppUrl = new URL(LOCAL_APP_TARGET);
} catch (e) {
  console.error('[proxy] Invalid LOCAL_APP_TARGET:', LOCAL_APP_TARGET, e);
  process.exit(1);
}

let targetUrl;
try {
  targetUrl = new URL(TARGET_ORIGIN);
} catch (e) {
  console.error('[proxy] Invalid TARGET_ORIGIN:', TARGET_ORIGIN, e);
  process.exit(1);
}

const isHttps = targetUrl.protocol === 'https:';
const upstreamRequest = isHttps ? httpsRequest : httpRequest;

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade'
]);

function filterHeaders(headers) {
  const result = {};
  for (const [k, v] of Object.entries(headers)) {
    if (v == null) continue;
    const lower = k.toLowerCase();
    if (HOP_BY_HOP.has(lower)) continue;
    // Override host header with target host.
    if (lower === 'host') {
      result['host'] = targetUrl.host;
      continue;
    }
    result[k] = v;
  }
  return result;
}

function setCors(res, origin) {
  // Allow any origin by default (adjust if you want stricter behavior)
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,Accept,Origin,X-Requested-With,Referer,User-Agent'
  );
}

const server = createServer((req, res) => {
  const start = Date.now();
  const { method = 'GET' } = req;
  const origin = req.headers.origin;
  setCors(res, origin);

  // Handle CORS preflight early
  if (method === 'OPTIONS') {
    const acrh = req.headers['access-control-request-headers'];
    if (acrh) res.setHeader('Access-Control-Allow-Headers', acrh);
    res.statusCode = 204; // No Content
    res.end();
    return;
  }

  const originalUrl = req.url || '/';
  let targetPath = originalUrl;
  let useLocalApp = false;
  let useLocalApi = false;
  let fullTarget;
  // 1. Explicit mounted prefix
  if (targetPath === LOCAL_APP_PREFIX || targetPath.startsWith(LOCAL_APP_PREFIX + '/')) {
    useLocalApp = true;
    let forwardPath = targetPath;
    if (LOCAL_STRIP_PREFIX) {
      forwardPath = targetPath.substring(LOCAL_APP_PREFIX.length) || '/';
    }
    fullTarget = new URL(forwardPath, localAppUrl);
  // 2. Root-level Next.js assets (absolute URLs from the HTML) optionally mapped to local
  } else if (
    LOCAL_SERVE_NEXT_ASSETS &&
    (targetPath === '/favicon.ico' || targetPath.startsWith('/_next/'))
  ) {
    useLocalApp = true;
    fullTarget = new URL(targetPath, localAppUrl);
  // 3. API prefix mapping
  } else if (
    targetPath === LOCAL_API_PREFIX || targetPath.startsWith(LOCAL_API_PREFIX + '/')
  ) {
    useLocalApi = true;
    let apiForwardPath = targetPath;
    if (LOCAL_API_STRIP) {
      apiForwardPath = targetPath.substring(LOCAL_API_PREFIX.length) || '/';
    }
    fullTarget = new URL(apiForwardPath, localApiUrl);
  } else {
    fullTarget = new URL(targetPath, targetUrl);
  }

  const headers = filterHeaders(req.headers);

  const options = {
    protocol: fullTarget.protocol,
    hostname: fullTarget.hostname,
    port: fullTarget.port || (fullTarget.protocol === 'https:' ? 443 : 80),
    method,
    path: fullTarget.pathname + fullTarget.search,
    headers
  };

  const selectedRequester = useLocalApp
    ? (localAppUrl.protocol === 'https:' ? httpsRequest : httpRequest)
    : useLocalApi
      ? (localApiUrl.protocol === 'https:' ? httpsRequest : httpRequest)
      : upstreamRequest;
  const upstream = selectedRequester(options, (upRes) => {
    // Forward status & headers (filter hop-by-hop)
    res.statusCode = upRes.statusCode || 500;
    for (const [k, v] of Object.entries(upRes.headers)) {
      if (!v) continue;
      const lower = k.toLowerCase();
      if (HOP_BY_HOP.has(lower)) continue;
      // Avoid overwriting our CORS headers
      if (lower.startsWith('access-control-')) continue;
      // Optionally rewrite Set-Cookie Path for local API so that cookies apply to mounted UI prefix
      if (lower === 'set-cookie') {
        let cookies = Array.isArray(v) ? v : [v];
        // Local API explicit path rewrite (legacy option)
        if (useLocalApi && LOCAL_COOKIE_PATH_REWRITE) {
          cookies = cookies.map((c) => c.replace(/; *Path=[^;]*/i, ''))
            .map((c) => `${c}; Path=${LOCAL_COOKIE_PATH_REWRITE}`);
        }
        // Generic prefix-based widening
        if (WIDEN_COOKIE_PREFIX) {
          cookies = cookies.map((c) => {
            // Extract existing Path= if any
            const pathMatch = c.match(/;\s*Path=([^;]*)/i);
            if (pathMatch) {
              const currentPath = pathMatch[1];
              if (currentPath.startsWith(WIDEN_COOKIE_PREFIX)) {
                return c.replace(/;\s*Path=[^;]*/i, `; Path=${WIDEN_COOKIE_NEW_PATH}`);
              }
              return c; // path exists but not under prefix
            } else if (COOKIE_ADD_PATH_IF_MISSING) {
              // No Path attribute; optionally add one to broaden scope
              return c + `; Path=${WIDEN_COOKIE_NEW_PATH}`;
            }
            return c;
          });
        }
        res.setHeader(k, cookies);
        continue;
      }
      // Node may return headers as string | string[]
      res.setHeader(k, v);
    }
    // Ensure CORS headers still present
    setCors(res, origin);

    pipeline(upRes, res, (err) => {
      const ms = Date.now() - start;
      if (err) {
        console.error('[proxy] Pipeline error', err);
      }
      const bucket = useLocalApp ? '[local-app]' : useLocalApi ? '[local-api]' : '[remote]';
      console.log(
        `[proxy] ${method} ${originalUrl} -> ${bucket} ${fullTarget.href} ${upRes.statusCode} ${ms}ms`
      );
    });
  });

  upstream.on('error', (err) => {
    console.error('[proxy] Upstream request error:', err.message);
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(
      JSON.stringify({ error: 'Bad Gateway', detail: err.message, target: TARGET_ORIGIN })
    );
  });

  // Stream body (if any)
  if (method === 'GET' || method === 'HEAD') {
    upstream.end();
  } else {
    pipeline(req, upstream, (err) => {
      if (err) console.error('[proxy] Request body pipeline error:', err.message);
    });
  }
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, () => {
  console.log(
    `[proxy] Listening on http://localhost:${PORT} -> ${TARGET_ORIGIN} (HTTPS: ${isHttps})`
  );
});

process.on('SIGINT', () => {
  console.log('\n[proxy] Shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\n[proxy] Shutting down');
  server.close(() => process.exit(0));
});
