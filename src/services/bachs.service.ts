const BACHS_API_URL = process.env.BACHS_API_URL || "https://sandbox-api.bachs.io";
const BACHS_SECRET_KEY = process.env.BACHS_SECRET_KEY;

if (!BACHS_SECRET_KEY) {
  throw new Error("Set BACHS_SECRET_KEY");
}

export async function createCheckoutSession(params: {
  amountNaira: number;
  email: string;
  reference: string;
}) {
  const res = await fetch(`${BACHS_API_URL}/v1/checkout-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BACHS_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pricing: {
        currency: "NGN",
        amount: params.amountNaira.toFixed(2),
      },
      customer: { email: params.email },
      reference: params.reference,
      success_url: `${process.env.FRONTEND_URL}/wallet?status=success`,
      cancel_url: `${process.env.FRONTEND_URL}/wallet?status=cancelled`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bachs checkout session failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    checkout_id: string;
    checkout_url: string;
    status: string;
    expires_at: string;
    created_at: string;
  }>;
}