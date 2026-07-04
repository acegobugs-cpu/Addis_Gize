import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { client } from "./app/lib/client";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function proxy(request: NextRequest) {
  // Use a single mutable response object throughout the entire pipeline lifecycle
  let response = NextResponse.next();
  
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const csrfToken = request.cookies.get("csrf_token")?.value;
  const csrfSession = request.cookies.get("csrf_session")?.value;
  const pathname = request.nextUrl.pathname;

  const publicRoutes = ["/login", "/register"];

  // 1. Silent Server-Side CSRF Bootstrap
  if (!csrfToken || !csrfSession) {
    try {
      const bootstrapRes = await client.get(`/auth/csrf/token`);
      if (bootstrapRes.ok) {
        const setCookieHeaders = bootstrapRes.headers.getSetCookie();
        setCookieHeaders.forEach((cookieStr: string) => {
          response.headers.append("Set-Cookie", cookieStr);
        });
      }
    } catch (err) {
      console.error("Server-side CSRF bootstrapping failed:", err);
    }
  }

  // 2. Validate Identity Access Token Boundary
  let isTokenValid = false;
  
  if (accessToken) {
    try {
      await jwtVerify(accessToken, JWT_SECRET);
      isTokenValid = true;
    } catch (err) {
      // Access token is invalid or expired. Let's look for a recovery path before giving up.
      isTokenValid = false;
    }
  }

  // 3. 🟢 THE RECOVERY PIPELINE: Access Token is dead, but can we refresh?
  if (!isTokenValid && refreshToken) {
    try {      
      // Pass along the existing cookies so Go can validate the refresh_token string
      const refreshRes = await client.post(`/auth/refresh`);

      if (refreshRes.ok) {
        // Core validation passed! Go sent fresh cookies down.
        isTokenValid = true;
        
        // Feed the new cookie headers straight to the response payload out to the browser
        const setCookieHeaders = refreshRes.headers.getSetCookie();
        setCookieHeaders.forEach((cookieStr: string) => {
          response.headers.append("Set-Cookie", cookieStr);
        });
      }
    } catch (refreshErr) {
      console.error("Server-side token rotation pipeline crashed:", refreshErr);
    }
  }

  // 4. ROUTING LOGIC GATEWAYS

  // Redirect unauthenticated users from protected routes to login
  if (!isTokenValid && !publicRoutes.some((path) => pathname.startsWith(path))) {
    const loginUrl = new URL("/login", request.url);
    // Create redirect response but carry over the bootstrapped CSRF headers we collected!
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        redirectResponse.headers.append(key, value);
      }
    });
    return redirectResponse;
  }

  // Redirect authenticated users from auth pages to dashboard
  if (isTokenValid && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Root path handling
  if (pathname === "/") {
    if (isTokenValid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Return the mutable response holding any new cookies we attached
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};