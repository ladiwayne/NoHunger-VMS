/*
  Deployment smoke checks for NoHunger VMS.
  Usage:
    FRONTEND_URL=https://your-frontend.vercel.app BACKEND_URL=https://your-backend.up.railway.app/api node scripts/smoke_deploy_check.js
*/

const stripTrailingSlash = (url) => url.replace(/\/+$/, '');

const normalizeAbsoluteUrl = (url) => {
  const trimmed = stripTrailingSlash(String(url || '').trim());
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const normalizeBackendApiBase = (url) => {
  const absolute = normalizeAbsoluteUrl(url);
  if (!absolute) return '';
  const parsed = new URL(absolute);
  if (!parsed.pathname || parsed.pathname === '/') {
    parsed.pathname = '/api';
  } else if (!parsed.pathname.endsWith('/api')) {
    parsed.pathname = `${stripTrailingSlash(parsed.pathname)}/api`;
  }
  return stripTrailingSlash(parsed.toString());
};

const expectStatus = async (url, allowed, label) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let res;
  try {
    res = await fetch(url, { method: 'GET', signal: controller.signal });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error(`${label} timed out after 10s. URL=${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!allowed.includes(res.status)) {
    const body = await res.text().catch(() => '');
    throw new Error(`${label} expected status ${allowed.join('/')} but got ${res.status}. URL=${url}. Body=${body.slice(0, 200)}`);
  }
  return res.status;
};

async function main() {
  const frontendBase = normalizeAbsoluteUrl(process.env.FRONTEND_URL);
  const backendApiBase = normalizeBackendApiBase(process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL);

  if (!frontendBase) {
    throw new Error('Missing FRONTEND_URL environment variable.');
  }
  if (!backendApiBase) {
    throw new Error('Missing BACKEND_URL (or NEXT_PUBLIC_API_URL) environment variable.');
  }

  const backendOrigin = new URL(backendApiBase).origin;

  const checks = [
    { url: `${backendOrigin}/health`, statuses: [200], label: 'Backend /health' },
    { url: `${backendApiBase}/health`, statuses: [200], label: 'Backend /api/health' },
    { url: `${frontendBase}/sign-up-login-screen`, statuses: [200], label: 'Frontend sign-in page' },
    { url: `${frontendBase}/api/auth/me`, statuses: [200, 401], label: 'Frontend auth proxy /api/auth/me' },
  ];

  for (const check of checks) {
    const status = await expectStatus(check.url, check.statuses, check.label);
    console.log(`PASS: ${check.label} -> ${status}`);
  }

  console.log('Deployment smoke checks passed.');
}

main().catch((err) => {
  console.error('Deployment smoke checks failed.');
  console.error(err.message || err);
  process.exit(1);
});