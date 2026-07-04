/**
 * Typed API client that automatically attaches the JWT Bearer token
 * and handles silent token refresh on 401 responses.
 *
 * Usage:
 *   import { apiGet, apiPost } from '@/lib/api-client'
 *   const user = await apiGet<UserPublic>('/api/auth/me')
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

// Helper to get base domain (stripping /api if it exists)
export const getApiBaseDomain = (): string => {
  return API_BASE.replace(/\/api\/?$/, "");
};

// ── Token storage helpers ─────────────────────────────────────────────────────

export const getAccessToken = (): string | null => localStorage.getItem("access_token");

export const getRefreshToken = (): string | null => localStorage.getItem("refresh_token");

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// ── Silent refresh ────────────────────────────────────────────────────────────

let _refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  // Build the full URL — support both relative paths and absolute URLs
  const url = path.startsWith("http") ? path : `${getApiBaseDomain()}${path}`;

  const accessToken = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, { ...options, headers });

  // On 401: try a silent token refresh, then retry the original request once
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
    // Refresh failed — clear tokens and let the caller handle the error
    clearTokens();
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ── Typed convenience methods ─────────────────────────────────────────────────

export const apiGet = <T>(path: string): Promise<T> => apiFetch<T>(path, { method: "GET" });

export const apiPost = <T>(path: string, body: unknown): Promise<T> =>
  apiFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const apiDelete = <T>(path: string): Promise<T> => apiFetch<T>(path, { method: "DELETE" });
