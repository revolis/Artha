import { NextResponse, type NextRequest } from "next/server";
<<<<<<< HEAD

const PUBLIC_EXACT_PATHS = new Set(["/", "/login"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/reports/shared/")) {
    return true;
=======
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_PATHS = new Set(["/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Development flag to disable authentication - DO NOT ENABLE IN PRODUCTION
  if (process.env.DISABLE_AUTH === "true") {
    return NextResponse.next();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
<<<<<<< HEAD
    pathname.startsWith("/favicon")
  ) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const authPresence = request.cookies.get("artha_auth")?.value;
  if (authPresence !== "1") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
=======
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'none',
            secure: true,
            path: '/',
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
            sameSite: 'none',
            secure: true,
            path: '/',
            maxAge: 0,
          });
        }
      }
    }
  );

  // Use getUser() instead of getSession() for security
  // This triggers token refresh if needed
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
