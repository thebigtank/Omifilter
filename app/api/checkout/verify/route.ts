import { NextRequest, NextResponse } from "next/server";
import { getOrderByReference, markOrderPaid } from "../../../lib/db";
import { verifyTransaction } from "../../../lib/paystack";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const reference = body?.reference;
  if (typeof reference !== "string" || !reference.trim()) {
    return NextResponse.json({ ok: false, reason: "Missing reference." }, { status: 400 });
  }

  const order = getOrderByReference(reference.trim());
  if (!order) {
    return NextResponse.json({ ok: false, reason: "Order not found." }, { status: 404 });
  }

  const result = await verifyTransaction(reference.trim());
  if (!result) {
    return NextResponse.json({ ok: false, reason: "Could not reach Paystack." }, { status: 502 });
  }

  if (
    result.status !== "success" ||
    result.amount !== order.amount_kobo ||
    result.currency !== order.currency
  ) {
    return NextResponse.json({ ok: false, reason: "Payment could not be verified." }, { status: 402 });
  }

  markOrderPaid(reference.trim(), result.amount);

  return NextResponse.json({ ok: true, slug: order.tier_slug });
}
