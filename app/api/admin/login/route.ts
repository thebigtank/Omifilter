import { NextRequest, NextResponse } from "next/server";
import { checkPassword, signSession, ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_MS } from "../../../lib/adminAuth";
import { verifyTurnstileToken } from "../../../lib/turnstile";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : "";

  const turnstileOk = turnstileToken
    ? await verifyTurnstileToken(turnstileToken, req.headers.get("x-forwarded-for") ?? undefined)
    : false;
  const ok = turnstileOk && password ? await checkPassword(password) : false;

  // Fixed delay on every attempt (success or failure) to blunt rapid-fire guessing.
  await sleep(400);

  if (!turnstileOk) {
    return NextResponse.json({ ok: false, reason: "Verification check failed — please retry." }, { status: 400 });
  }
  if (!ok) {
    return NextResponse.json({ ok: false, reason: "Incorrect password." }, { status: 401 });
  }

  const token = await signSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  });
  return res;
}
