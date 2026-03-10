import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_EXACT_PATHS = new Set(["/", "/login"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/reports/shared/")) {
    return true;
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.DISABLE_AUTH === "true" || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const authPresence = request.cookies.get("artha_auth")?.value;
  if (authPresence !== "1") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
