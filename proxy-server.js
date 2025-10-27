import { createServer } from 'http';
import http from 'http';
import https from 'https';

// Constants
const PROXY_PORT = 3300;
const CLIENT_APP_PORT = 3000;
const SERVER_APP_PORT = 3388;
const CW_CLOUD = 'https://us.cwcloudtest.com';
const SERVICE_NAME = 'ai-assistant';
// If true, proxy service API requests to local server (localhost), otherwise to CW_CLOUD
const USE_LOCAL_SERVER = true; // Set to false to enable cloud proxy mode

// Map of firm -> firmGuid or Promise
const firmGuids = new Map();
let engagement;

// Utility to get firmGuid, resolving and caching if needed
// Ensures concurrent requests for the same firm share the same in-flight Promise,
// so only one resolveFirmGuid runs per firm at a time.
async function getFirmGuid(host, firm) {
  if (!firm) return undefined;
  let value = firmGuids.get(firm);
  if (value) {
    // If value is a Promise (in-flight), await it so all callers share the same resolution
    if (typeof value.then === 'function') {
      try {
        return await value;
      } catch (err) {
        firmGuids.delete(firm);
        throw err;
      }
    }
    // Otherwise, it's the guid
    return value;
  }
  // No value yet: start resolving, store the Promise to avoid duplicate requests
  const promise = resolveFirmGuid(host, firm).catch(err => {
    firmGuids.delete(firm);
    throw err;
  });
  firmGuids.set(firm, promise);
  try {
    const guid = await promise;
    // Replace the Promise with the resolved guid for future calls
    firmGuids.set(firm, guid);
    return guid;
  } catch (err) {
    // Error already handled above (cache cleared), just propagate
    throw err;
  }
}

// Utility function to resolve firm guid
async function resolveFirmGuid(host, firm) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host.replace(/^https?:\/\//, ''),
      path: `/${firm}/firmLoginToFirmGuid`,
      method: 'GET',
      headers: { 'Accept': '*/*' },
    };
    const req = https.request(options, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        const guid = res.headers.location.replace(/^\//, '').toLowerCase();
        firmGuids.set(firm, guid);
        resolve(guid);
      } else {
        reject(new Error('Failed to resolve firm guid: unexpected response'));
      }
    });
    req.on('error', reject);
    req.end();
  });
}

// Utility function to extract firm and engagement from URL
function parseAidaUrl(url) {
  const match = url.match(/^\/([^/]+)\/e\/eng\/([^/]+)\/s\/aida-agent/);
  if (match) {
    return {
      firm: match[1],
      engagement: match[2]
    };
  }
  return null;
}

const server = createServer(async (req, res) => {
  // Proxy service API requests to local server app or CW_CLOUD
  if (isServiceApiRequest(req.url)) {
    // Extract firm from the incoming URL (assume /{firm}/ms/{SERVICE_NAME}/...)
    const firmMatch = req.url.match(/^\/([^/]+)\/ms\//);
    const firm = firmMatch ? firmMatch[1] : undefined;
    let firmGuid;
    if (firm) {
      try {
        firmGuid = await getFirmGuid(CW_CLOUD, firm);
      } catch (err) {
        console.error(`Error resolving firm guid for ${firm}:`, err);
      }
    }

    let targetUrl, path, options, proxyModule, logTarget;
    // Use local server or cloud based on USE_LOCAL_SERVER
    if (USE_LOCAL_SERVER) {
      // For local server, rewrite the path
      const rewrittenPath = rewriteServiceApiPath(req.url);
      targetUrl = new URL(rewrittenPath, `http://localhost:${SERVER_APP_PORT}`);
      path = targetUrl.pathname + targetUrl.search;
      const headers = { ...req.headers };
      if (firm) headers['cloud-firm'] = firm;
      if (firmGuid) headers['cloud-firm-guid'] = firmGuid;
      if (engagement) headers['engagement-id-base64'] = engagement;
      options = {
        hostname: 'localhost',
        port: SERVER_APP_PORT,
        path,
        method: req.method,
        headers
      };
      proxyModule = http;
      logTarget = `http://localhost:${SERVER_APP_PORT}${path}`;
    } else {
      // For cloud, retain the full original path
      targetUrl = new URL(req.url, CW_CLOUD);
      path = targetUrl.pathname + targetUrl.search;
      const headers = { ...req.headers };
      if (firm) headers['cloud-firm'] = firm;
      if (firmGuid) headers['cloud-firm-guid'] = firmGuid;
      if (engagement) headers['engagement-id-base64'] = engagement;
      headers.host = targetUrl.hostname;
      options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path,
        method: req.method,
        headers
      };
      proxyModule = targetUrl.protocol === 'https:' ? https : http;
      logTarget = `${targetUrl.protocol}//${targetUrl.hostname}${options.port ? `:${options.port}` : ''}${path}`;
    }
    console.log(`[api PROXY] ${req.url} -> ${logTarget}`);
    const proxyReq = proxyModule.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });
    req.pipe(proxyReq);
    return;
  }
  // Serve static assets from local client app
  if (isStaticAsset(req.url)) {
    const targetUrl = new URL(req.url, `http://localhost:${CLIENT_APP_PORT}`);
    const path = targetUrl.pathname + targetUrl.search;
    const options = {
      hostname: 'localhost',
      port: CLIENT_APP_PORT,
      path,
      method: req.method,
      headers: req.headers
    };
    console.log(`[static PROXY] ${req.url} -> http://localhost:${CLIENT_APP_PORT}${path}`);
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });
    req.pipe(proxyReq);
    return;
  }
  // Check if this is an AIDA URL
  const aidaParams = parseAidaUrl(req.url);
  if (aidaParams) {
    engagement = aidaParams.engagement;
    const firm = aidaParams.firm;
    let firmGuid;
    if (firm) {
      try {
        firmGuid = await getFirmGuid(CW_CLOUD, firm);
        if (firmGuid) {
          console.log(`Resolved firm guid for ${firm}:`, firmGuid);
        }
      } catch (err) {
        console.error(`Error resolving firm guid for ${firm}:`, err);
      }
    }
    // Route to local client app (always HTTP), always to root but preserve query string
    const targetUrl = new URL(req.url, `http://localhost:${CLIENT_APP_PORT}`);
    const path = targetUrl.search ? '/' + targetUrl.search : '/';
    const options = {
      hostname: 'localhost',
      port: CLIENT_APP_PORT,
      path,
      method: req.method,
      headers: req.headers
    };
    // Log incoming and outgoing proxy request
    console.log(`[aida PROXY] ${req.url} -> http://localhost:${CLIENT_APP_PORT}${path}`);
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway, start the client app using pnpm dev');
    });
    req.pipe(proxyReq);
    return;
  }
  
  // Parse the target URL using WHATWG URL API
  const targetUrl = new URL(req.url, CW_CLOUD);
  
  // Update Host header to match target server
  const headers = { ...req.headers };
  headers.host = targetUrl.hostname;
  
  // Prepare proxy request options
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: headers
  };
  // Choose http or https based on protocol
  const proxyModule = targetUrl.protocol === 'https:' ? https : http;
  // Log incoming and outgoing proxy request
  const proto = targetUrl.protocol.replace(':', '');
  const port = options.port;
  const fullUrl = `${proto}://${options.hostname}${port ? `:${port}` : ''}${options.path}`;
  console.log(`[PROXY] ${req.url} -> ${fullUrl}`);
  const proxyReq = proxyModule.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  });
  req.pipe(proxyReq);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(PROXY_PORT, () => {
  console.log(`Proxy server running on http://localhost:${PROXY_PORT}`);
  console.log(`Forwarding requests to ${CW_CLOUD}`);
});

// Utility function to check if a request is for the service API
function isServiceApiRequest(url) {
  // Matches /something/ms/ai-assistant/...
  const pattern = new RegExp(`/ms/${SERVICE_NAME}(/|$)`);
  return pattern.test(url);
}

// Utility function to rewrite the path for service API requests
function rewriteServiceApiPath(url) {
  // Remove everything up to and including /ms/{SERVICE_NAME}
  const idx = url.indexOf(`/ms/${SERVICE_NAME}`);
  if (idx === -1) return url;
  return url.substring(idx + `/ms/${SERVICE_NAME}`.length) || '/';
}
// Utility function to check if a request is for a static asset
function isStaticAsset(url) {
  return (
    url.startsWith('/_next/') ||
    url.startsWith('/__nextjs') ||
    url.startsWith('/favicon') ||
    url.startsWith('/.well-known/')
  );
}
