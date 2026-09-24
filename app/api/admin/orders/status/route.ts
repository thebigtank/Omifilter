import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySession } from "../../../../lib/adminAuth";
import { setPodStatus } from "../../../../lib/db";
import { isPodStatus } from "../../../../lib/payment";

export async function POST(req: NextRequest) {
  // proxy.ts already guards /api/admin; checked again since this route writes.
  if (!(await verifySession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value))) {
    return NextResponse.json({ ok: false, reason: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const reference = body?.reference;
  const status = body?.status;
  if (typeof reference !== "string" || !reference.trim()) {
    return NextResponse.json({ ok: false, reason: "Missing reference." }, { status: 400 });
  }
  if (!isPodStatus(status)) {
    return NextResponse.json({ ok: false, reason: "Invalid status." }, { status: 400 });
  }

  if (!setPodStatus(reference.trim(), status)) {
    return NextResponse.json({ ok: false, reason: "Pay-on-delivery order not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
