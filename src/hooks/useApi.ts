const API_BASE = '/api';

export function useApi(token: string | null) {
  const headers = (extra?: Record<string, string>) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  });

  async function get(path: string) {
    const res = await fetch(`${API_BASE}${path}`, { headers: headers() });
    return res.json();
  }

  async function post(path: string, body: unknown) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function put(path: string, body: unknown) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    });
    return res.json();
  }

  return { get, post, put };
}
