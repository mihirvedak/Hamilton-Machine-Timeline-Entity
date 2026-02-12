/**
 * Authentication Service
 * Handles cookie-based token management for IOsense API authentication.
 *
 * Flow:
 *  1. Check for `token` cookie → use as Bearer JWT directly.
 *  2. Support SSO: extract ?token=xxx from URL → call validateSSOToken → store JWT in cookie.
 *  3. If no token → unauthenticated.
 */

const IOSENSE_CONNECTOR = "https://connector.iosense.io";

interface AuthTokens {
  accessToken: string;
  organisation: string;
  userId: string;
  expiresAt: number;
}

interface SSOValidationResponse {
  success: boolean;
  token: string;       // "Bearer eyJ..."
  organisation: string;
  userId: string;
  errors?: string[];
}

class AuthService {
  private tokens: AuthTokens | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  // ── Cookie helpers ──────────────────────────────────────────────

  private getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  }

  private setCookie(name: string, value: string, maxAgeSec = 86400): void {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
  }

  private deleteCookie(name: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0`;
  }

  // ── Storage helpers ─────────────────────────────────────────────

  private persistTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
    // Also keep in localStorage as fallback
    try {
      localStorage.setItem("iosense_auth", JSON.stringify(tokens));
    } catch {
      // storage not available
    }
  }

  private loadTokensFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      // Priority 1: cookie
      const cookieToken = this.getCookie("token");
      const cookieUserId = this.getCookie("userId");
      const cookieOrg = this.getCookie("organisation");

      if (cookieToken) {
        // Ensure token is in Bearer format
        const bearerToken = cookieToken.startsWith("Bearer ")
          ? cookieToken
          : `Bearer ${cookieToken}`;

        this.tokens = {
          accessToken: bearerToken,
          organisation: cookieOrg || "",
          userId: cookieUserId || "",
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
        };
        return;
      }

      // Priority 2: localStorage
      const stored = localStorage.getItem("iosense_auth");
      if (stored) {
        const parsed: AuthTokens = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          this.tokens = parsed;
          return;
        }
        localStorage.removeItem("iosense_auth");
      }
    } catch (error) {
      console.error("Failed to load auth tokens:", error);
      this.tokens = null;
    }
  }

  // ── SSO Token validation ────────────────────────────────────────

  /**
   * Exchange a one-time SSO token (from URL ?token=xxx) for a Bearer JWT.
   * The SSO token is deleted server-side after successful retrieval.
   */
  async validateSSOToken(ssoToken: string): Promise<AuthTokens> {
    const res = await fetch(
      `${IOSENSE_CONNECTOR}/api/retrieve-sso-token/${ssoToken}`,
      {
        method: "GET",
        headers: {
          organisation: "https://iosense.io",
          "ngsw-bypass": "true",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`SSO validation failed (HTTP ${res.status})`);
    }

    const data: SSOValidationResponse = await res.json();

    if (!data.success) {
      throw new Error(data.errors?.join(", ") || "SSO token validation failed");
    }

    const tokens: AuthTokens = {
      accessToken: data.token, // already "Bearer eyJ..."
      organisation: data.organisation,
      userId: data.userId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    // Persist to cookie + localStorage
    this.setCookie("token", data.token);
    this.setCookie("userId", data.userId);
    this.setCookie("organisation", data.organisation);
    this.persistTokens(tokens);

    return tokens;
  }

  /**
   * Check URL for ?token=xxx, validate it, and clean the URL.
   * Returns true if an SSO token was found and validated.
   */
  async handleSSOFromURL(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("token");

    if (!ssoToken) return false;

    try {
      await this.validateSSOToken(ssoToken);

      // Clean the token from URL
      params.delete("token");
      const cleanURL =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", cleanURL);

      return true;
    } catch (error) {
      console.error("SSO token validation failed:", error);
      return false;
    }
  }

  // ── Public API ──────────────────────────────────────────────────

  getAccessToken(): string | null {
    if (!this.tokens) {
      this.loadTokensFromStorage();
    }

    if (!this.tokens) return null;

    // Check expiry
    if (Date.now() >= this.tokens.expiresAt) {
      console.warn("Access token expired");
      // Try reloading from cookie (may have been refreshed externally)
      const cookieToken = this.getCookie("token");
      if (cookieToken) {
        const bearerToken = cookieToken.startsWith("Bearer ")
          ? cookieToken
          : `Bearer ${cookieToken}`;
        this.tokens = {
          ...this.tokens,
          accessToken: bearerToken,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        return this.tokens.accessToken;
      }
      return null;
    }

    return this.tokens.accessToken;
  }

  getOrganisation(): string | null {
    return this.tokens?.organisation || this.getCookie("organisation") || null;
  }

  getUserId(): string | null {
    return this.tokens?.userId || this.getCookie("userId") || null;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  clearTokens(): void {
    this.tokens = null;
    this.deleteCookie("token");
    this.deleteCookie("userId");
    this.deleteCookie("organisation");
    try {
      localStorage.removeItem("iosense_auth");
    } catch {
      // storage not available
    }
  }

  refreshTokens(): void {
    this.loadTokensFromStorage();
  }
}

// Singleton
export const authService = new AuthService();
export { AuthService };
export type { AuthTokens };
