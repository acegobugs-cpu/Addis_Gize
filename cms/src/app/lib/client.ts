import { cookies, headers } from "next/headers";

interface RequestOptions extends RequestInit {
  /** Optional body payload that handles automatic JSON serialization */
  json?: Record<string, any>;
  /** Explicitly pass the CSRF token from Server Actions if overridden manually */
  csrfToken?: string;
}

class BackendClient {
  private baseUrl: string;

  constructor() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
    this.baseUrl = `${apiBase}/api/v1`;
  }

  /**
   * Safe utility helper to extract and write updated response cookies 
   * directly into the Next.js state jar.
   */
  private async syncCookiesToNextJar(setCookieHeader: string | null) {
    if (!setCookieHeader) return;
    const cookieStore = await cookies();

    // Split and parse separate cookies (handling multiple Set-Cookie fields cleanly)
    const rawCookies = setCookieHeader.split(/,\s*(?=[a-zA-Z0-9-_]+=)/);
    
    for (const cookieStr of rawCookies) {
      const parts = cookieStr.split(";")[0].split("=");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts[1].trim();
        
        // Dynamic flags collection regex
        const isHttpOnly = /HttpOnly/i.test(cookieStr);
        const isSecure = /Secure/i.test(cookieStr);
        const sameSiteMatch = cookieStr.match(/SameSite=(Lax|Strict|None)/i);
        const sameSite = sameSiteMatch ? (sameSiteMatch[1] as "lax" | "strict" | "none") : "lax";

        cookieStore.set(name, value, {
          httpOnly: isHttpOnly,
          secure: isSecure,
          sameSite: sameSite.toLowerCase() as "lax" | "strict" | "none",
          path: "/",
        });
      }
    }
  }

  private async request(path: string, options: RequestOptions = {}): Promise<Response> {
    // console.log("requesrrrt ",options.json)
    const url = `${this.baseUrl}${path}`;
    const nextHeaders = await headers();
    const nextCookies = await cookies();
    const targetHeaders = new Headers(options.headers);

    // 1. Serialization Utility Layer
    if (options.json) {
      targetHeaders.set("Content-Type", "application/json");
      options.body = JSON.stringify(options.json);
      delete options.json;
    }

    // 2. Extract tokens from server-side safe HttpOnly cookie store
    const accessToken = nextCookies.get("access_token")?.value;
    const refreshToken = nextCookies.get("refresh_token")?.value;
    const csrfSession = nextCookies.get("csrf_session")?.value;
    const csrfToken = nextCookies.get("csrf_token")?.value;

    if (accessToken) {
      targetHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    // 3. Re-serialize individual cookies to transport over the server-to-server gateway
    const cookiePairs: string[] = [];
    if (refreshToken) cookiePairs.push(`refresh_token=${refreshToken}`);
    if (csrfSession) cookiePairs.push(`csrf_session=${csrfSession}`);
    if (csrfToken) cookiePairs.push(`csrf_token=${csrfToken}`);

    if (cookiePairs.length > 0) {
      targetHeaders.set("Cookie", cookiePairs.join("; "));
    }

    // 4. Handle initial State Mutations Header injection
    const method = (options.method || "GET").toUpperCase();
    const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
    
    if (isMutation) {
      const token = options.csrfToken || nextHeaders.get("X-CSRF-Token") || csrfToken;
      if (token) {
        targetHeaders.set("X-CSRF-Token", token);
      }
      delete options.csrfToken;
    }

    const config: RequestInit = {
      ...options,
      headers: targetHeaders,
      credentials: "include", 
    };

    // 5. Initial Execution Boundary
    let response = await fetch(url, config);

    // 6. Dual-Interception Architecture Routing Lifecycle
    if (!response.ok) {
      try {
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();

        // CASE A: Access Token Expired or Missing (Code: 1001) -> Silent Session Rotation Loop
        if (errorData.statusCode === 1002 && refreshToken) {          
          if (csrfToken) {
            targetHeaders.set("X-CSRF-Token", csrfToken);
          }

          const refreshAuthRes = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: "POST",
            headers: targetHeaders,
            credentials: "include",
          });

          if (refreshAuthRes.ok) {
            const setCookieHeader = refreshAuthRes.headers.get("Set-Cookie");
            if (setCookieHeader) {
              // Commit the changes server-side into Next.js storage context
              await this.syncCookiesToNextJar(setCookieHeader);
              
              targetHeaders.set("Cookie", setCookieHeader);
              
              const tokenMatch = setCookieHeader.match(/access_token=([^;]+)/);
              if (tokenMatch && tokenMatch[1]) {
                targetHeaders.set("Authorization", `Bearer ${tokenMatch[1]}`);
              }

              config.headers = targetHeaders;
              return fetch(url, config); // Re-fire original query
            }
          }
        }

        // CASE B: CSRF Perimeter Defeated (Code: 449) -> Silent Cryptographic Repair Loop
        if (errorData.statusCode === 449 && isMutation) {

          const refreshCSRFRes = await fetch(`${this.baseUrl}/auth/csrf/token`, {
            method: "GET",
            headers: { "Cookie": targetHeaders.get("Cookie") || "" },
          });

          if (refreshCSRFRes.ok) {
            const setCookieHeader = refreshCSRFRes.headers.get("Set-Cookie");
            if (setCookieHeader) {
              await this.syncCookiesToNextJar(setCookieHeader);
              
              targetHeaders.set("Cookie", setCookieHeader);
              
              const tokenMatch = setCookieHeader.match(/csrf_token=([^;]+)/);
              if (tokenMatch && tokenMatch[1]) {
                targetHeaders.set("X-CSRF-Token", tokenMatch[1]);
              }

              config.headers = targetHeaders;
              return fetch(url, config); // Re-fire mutation request
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse non-fatal interceptor application payload code:", e);
      }
    }

    return response;
  }

  public async get(path: string, options?: RequestOptions) { return this.request(path, { ...options, method: "GET" }); }
  public async post(path: string, body?: Record<string, any>, options?: RequestOptions) { return this.request(path, { ...options, method: "POST", json: body }); }
  public async patch(path: string, body?: Record<string, any>, options?: RequestOptions) { return this.request(path, { ...options, method: "PATCH", json: body }); }
  public async put(path: string, body?: Record<string, any>, options?: RequestOptions) { return this.request(path, { ...options, method: "PUT", json: body }); }
  public async delete(path: string, options?: RequestOptions) { return this.request(path, { ...options, method: "DELETE" }); }
}

export const client = new BackendClient();