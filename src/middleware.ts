// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth"; // your NextAuth instance

export async function middleware(req: NextRequest) {
  const session = await auth(); // Get user session

  const { pathname } = req.nextUrl;

  // Allow access to public routes and static assets
  const isPublicPath =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/complete-profile" ||
    pathname === "/test" ||
    pathname === "/";

  if (isPublicPath) {
    console.log("public accessed");
    return NextResponse.next();
  }

  // If user is not authenticated, let NextAuth handle redirect (if needed)
  if (!session?.user || !session.user.id || !session.user.email) {
    const loginurl = req.nextUrl.clone();
    loginurl.pathname = "/login";
    return NextResponse.redirect(loginurl);
  }

  if (!session.user.verified) {
    const verifyUrl = req.nextUrl.clone();
    verifyUrl.pathname = "/verify";
    return NextResponse.redirect(verifyUrl);
  }

  if (!session.user.username) {
    const createUsernameUrl = req.nextUrl.clone();
    createUsernameUrl.pathname = "/create-username";
    return NextResponse.redirect(createUsernameUrl);
  }

  // ✅ Check if username is missing → force profile completion
  if (!session.user.username && pathname !== "/complete-profile") {
    const url = req.nextUrl.clone();
    url.pathname = "/complete-profile";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!api/auth|_next|static|favicon.ico).*)"],
};
