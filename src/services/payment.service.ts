export async function createCheckout(opts: {
  reference: string;
  amountKobo: number;
  email?: string;
}): Promise<string> {
  const key = process.env.YPG_API_KEY;
  if (!key) throw new Error("Payment provider not configured yet");

  // TODO: call the provider's "create checkout" API with opts.reference and
  // opts.amountKobo, then return the checkout URL it gives back.
  throw new Error("Provider call not implemented yet");
}