import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authService } from "@/services/auth.service";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  organisation: string | null;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    organisation: null,
    error: null,
  });

  const bootstrap = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      // 1. Try SSO token from URL (?token=xxx)
      const ssoHandled = await authService.handleSSOFromURL();

      if (!ssoHandled) {
        // 2. Fall back to cookie / localStorage
        authService.refreshTokens();
      }

      const authenticated = authService.isAuthenticated();

      setState({
        isAuthenticated: authenticated,
        isLoading: false,
        userId: authService.getUserId(),
        organisation: authService.getOrganisation(),
        error: authenticated ? null : "No valid token found",
      });
    } catch (err) {
      console.error("Auth bootstrap failed:", err);
      setState({
        isAuthenticated: false,
        isLoading: false,
        userId: null,
        organisation: null,
        error: err instanceof Error ? err.message : "Authentication failed",
      });
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const logout = useCallback(() => {
    authService.clearTokens();
    setState({
      isAuthenticated: false,
      isLoading: false,
      userId: null,
      organisation: null,
      error: null,
    });
  }, []);

  const refresh = useCallback(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <AuthContext.Provider value={{ ...state, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
