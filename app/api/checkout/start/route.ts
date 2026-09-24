import { NextRequest, NextResponse } from "next/server";
import { getTier } from "../../../tiers";
import { insertPendingOrder } from "../../../lib/db";
import { verifyTurnstileToken } from "../../../lib/turnstile";
import { isPaymentMethod } from "../../../lib/payment";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, reason: "Invalid request." }, { status: 400 });
  }

  const { reference, tierSlug, qty, email, firstName, lastName, phone, address, state, turnstileToken, paymentMethod } = body as Record<string, unknown>;

  if (typeof turnstileToken !== "string" || !turnstileToken) {
    return NextResponse.json({ ok: false, reason: "Verification check missing." }, { status: 400 });
  }
  const turnstileOk = await verifyTurnstileToken(turnstileToken, req.headers.get("x-forwarded-for") ?? undefined);
  if (!turnstileOk) {
    return NextResponse.json({ ok: false, reason: "Verification check failed — please retry." }, { status: 400 });
  }

  if (typeof reference !== "string" || !reference.trim()) {
    return NextResponse.json({ ok: false, reason: "Missing reference." }, { status: 400 });
  }
  if (typeof tierSlug !== "string") {
    return NextResponse.json({ ok: false, reason: "Missing product." }, { status: 400 });
  }
  const tier = getTier(tierSlug);
  if (!tier) {
    return NextResponse.json({ ok: false, reason: "Unknown product." }, { status: 400 });
  }

  const qtyNum = Math.min(20, Math.max(1, Math.floor(Number(qty))));
  if (!Number.isFinite(qtyNum)) {
    return NextResponse.json({ ok: false, reason: "Invalid quantity." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, reason: "Invalid email." }, { status: 400 });
  }
  const requiredFields = { firstName, lastName, phone, address, state };
  for (const [key, value] of Object.entries(requiredFields)) {
    if (typeof value !== "string" || !value.trim()) {
      return NextResponse.json({ ok: false, reason: `Missing ${key}.` }, { status: 400 });
    }
  }

  // Older cached checkout pages don't send a method; they only knew Paystack.
  const method = paymentMethod ?? "paystack";
  if (!isPaymentMethod(method)) {
    return NextResponse.json({ ok: false, reason: "Invalid payment method." }, { status: 400 });
  }

  const amountKobo = tier.priceKobo * qtyNum;

  insertPendingOrder({
    reference: reference.trim(),
    email: (email as string).trim(),
    firstName: (firstName as string).trim(),
    lastName: (lastName as string).trim(),
    phone: (phone as string).trim(),
    address: (address as string).trim(),
    state: (state as string).trim(),
    tierSlug: tier.slug,
    tierName: tier.name,
    qty: qtyNum,
    amountKobo,
    paymentMethod: method,
  });

  return NextResponse.json({ ok: true });
}
