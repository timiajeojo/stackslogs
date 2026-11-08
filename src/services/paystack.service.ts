// src/services/paystack.service.ts
import { createHmac, timingSafeEqual } from "crypto";

const BASE_URL = "https://api.paystack.co";

// Read at call time (not at import) so a missing key gives a clear error instead of crashing the server on boot.
function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

async function call(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== true) {
    throw new Error(json.message || `Paystack error ${res.status}`);
  }
  return json.data;
}

/** Starts a payment. Amount is in kobo. The user is sent to `authorization_url` to pay. */
export function initializeTransaction(opts: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  return call("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountKobo,
      currency: "NGN",
      reference: opts.reference,
      callback_url: opts.callbackUrl,
    }),
  });
}

/** Asks Paystack what happened to a payment. status is "success", "failed", "abandoned", ... */
export function verifyTransaction(
  reference: string
): Promise<{ status: string; amount: number; currency: string; reference: string }> {
  return call(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Paystack signs every webhook with HMAC-SHA512 of the raw body, using your secret key. */
export function verifyPaystackSignature(signature: string, rawBody: Buffer): boolean {
  const expected = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
