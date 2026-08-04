import { NextResponse, type NextRequest } from "next/server";
import { isValidLocale, SUPPORTED_LOCALES } from "./types/locale";

const defaultLocale = "am";

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language") || "";
  
  const preferredLocale = acceptLanguage
    .split(",")[0]
    .split("-")[0]
    .toLowerCase();

  return isValidLocale(preferredLocale)
    ? preferredLocale
    : defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if path starts with a supported locale
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // 2. Resolve target locale
  const locale = getLocale(request);

  // 3. Construct target path cleanly
  const targetPath = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  // Preserve query string (e.g. ?search=abc)
  const redirectUrl = new URL(targetPath, request.url);
  redirectUrl.search = request.nextUrl.search;

  // 4. Force immediate 307 redirect
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    // Explicitly intercept '/' so root never renders directly
    "/",
    // Intercept all other non-static routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};