/**
 * AuthContext — global authentication state for the entire application.
 *
 * Features:
 * - Persistent login: validates stored token against /api/auth/me on mount
 * - Provides login(), register(), logout() actions
 * - Listens for auth:logout events dispatched by the API client on 401
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiGet, apiPost, setTokens, clearTokens, getAccessToken } from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserPublic {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface AuthContextValue {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore the session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await apiGet<UserPublic>("/api/auth/me");
        setUser(me);
      } catch {
        // Token invalid or expired and refresh failed — clear state silently
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Listen for forced logouts triggered by the API client on unrecoverable 401s
  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      clearTokens();
    };
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<TokenResponse>("/api/auth/login", { email, password });
    setTokens(data.access_token, data.refresh_token);
    const me = await apiGet<UserPublic>("/api/auth/me");
    setUser(me);
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const data = await apiPost<TokenResponse>("/api/auth/register", {
        full_name: fullName,
        email,
        password,
      });
      setTokens(data.access_token, data.refresh_token);
      const me = await apiGet<UserPublic>("/api/auth/me");
      setUser(me);
    },
    [],
  );

  const logout = useCallback(() => {
    // Fire-and-forget the logout endpoint (stateless on server)
    apiPost("/api/auth/logout", {}).catch(() => {});
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
