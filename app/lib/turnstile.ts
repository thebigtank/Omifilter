export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  // In dev, Cloudflare's "always passes" test secret, paired with the test
  // site key in TurnstileWidget.tsx.
  const secretKey =
    process.env.NODE_ENV === "development"
      ? "1x0000000000000000000000000000000AA"
      : process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TURNSTILE_SECRET_KEY is not set");
  }
  if (!token) {
    return false;
  }

  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    return false;
  }

  const json = await res.json().catch(() => null);
  return Boolean(json?.success);
}
