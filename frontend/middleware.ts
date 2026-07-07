import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/sso-callback"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  // "session" is a plain (non-httpOnly) cookie the frontend sets itself on login/logout —
  // it only signals "there was a session" for early redirects. The backend's own httpOnly
  // access_token cookie lives on the API's origin and isn't visible to this middleware when
  // the frontend and API are on different hosts. Real auth is still enforced server-side on
  // every API call via the Authorization header / JWT.
  const hasSession = request.cookies.has("session");

  if (!isPublic && !hasSession && pathname !== "/") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
