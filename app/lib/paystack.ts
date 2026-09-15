export type PaystackVerifyResult = {
  status: string;
  amount: number;
  currency: string;
};

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResult | null> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return null;
  }

  const json = await res.json();
  if (!json?.status || !json?.data) {
    return null;
  }

  return {
    status: json.data.status,
    amount: json.data.amount,
    currency: json.data.currency,
  };
}
