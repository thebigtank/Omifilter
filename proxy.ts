import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySession } from "./app/lib/adminAuth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = await verifySession(token);

  if (valid) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ ok: false, reason: "Unauthorized." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
