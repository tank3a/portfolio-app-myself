const BASE = import.meta.env.VITE_API_BASE_URL || 'https://ai.tank3a.store';
const TOKEN_KEY = 'asset_api_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || '',
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function authHeaders(extra = {}) {
  const token = tokenStore.get();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export const api = {
  get: (path) =>
    fetch(`${BASE}${path}`, { headers: authHeaders() }).then(r => r.json()),
  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(r => r.json()),
  del: (path) =>
    fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() }).then(r => r.json()),
};
