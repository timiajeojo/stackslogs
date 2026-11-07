// src/services/youngpg.service.ts
// Client for the YoungPG Media reseller API (https://youngpgmedia.com.ng/api/v1).
// Requires YOUNGPG_API_KEY in the backend environment (never in web/).
// Key scopes needed: listings:read, orders:read, orders:write, wallet:read.

const BASE_URL = process.env.YOUNGPG_BASE_URL || "https://youngpgmedia.com.ng/api/v1";

type Envelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  meta?: unknown;
  errors?: unknown;
};

export class YoungPgError extends Error {
  status: number;
  details: unknown;
  // true when we can't tell whether the order went through (timeout, 502, network error).
  // Do NOT retry a purchase in that case: check listOrders() first.
  uncertain: boolean;

  constructor(message: string, status: number, details?: unknown, uncertain = false) {
    super(message);
    this.name = "YoungPgError";
    this.status = status;
    this.details = details;
    this.uncertain = uncertain;
  }
}

export type YpgListing = {
  slug: string;
  title: string;
  price_ngn: string | number; // naira, already converted at their rate
  available_stock: number;
  [key: string]: unknown;
};

export type YpgPurchase = {
  order_id: string | number;
  accounts: string[]; // "email:password"
  amount_ngn: string | number;
  new_balance_ngn: string | number;
};

export type ListingsQuery = {
  category_id?: string | number;
  subcategory_id?: string | number;
  search?: string;
  sort?: "sort_key" | "total_price" | "available_stock" | "title";
  direction?: "asc" | "desc";
  per_page?: number; // max 100
  page?: number;
};

/** Naira (string or number, e.g. "5000.00") to kobo, rounded to an integer. */
export function ngnToKobo(value: string | number): number {
  return Math.round(Number(value) * 100);
}

// ---- Pricing ----

// Your selling price = supplier cost + a flat margin of PRICE_MARGIN_NGN naira per account.
// Defaults to 1000. Override with PRICE_MARGIN_NGN in the backend environment (in naira).
const envMargin = process.env.PRICE_MARGIN_NGN;
const MARGIN_KOBO = Math.round((envMargin && Number.isFinite(Number(envMargin)) ? Number(envMargin) : 1000) * 100);

/** Supplier cost in naira (e.g. "5000.00") -> your selling price in kobo. */
export function sellPriceKobo(costNgn: string | number): number {
  return ngnToKobo(costNgn) + MARGIN_KOBO;
}

/**
 * What the storefront is allowed to see: your price only, never the supplier cost.
 * Add any other safe fields you want to expose (e.g. description, category) here.
 */
export function toStorefrontListing(l: YpgListing) {
  return {
    slug: l.slug,
    title: l.title,
    available_stock: l.available_stock,
    price: sellPriceKobo(l.price_ngn), // kobo, same unit as your ledger
  };
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  opts: { query?: Record<string, unknown>; body?: unknown; isPurchase?: boolean } = {}
): Promise<{ data: T; meta?: unknown }> {
  const key = process.env.YOUNGPG_API_KEY;
  if (!key) throw new YoungPgError("YOUNGPG_API_KEY is not set", 500);

  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "X-API-Key": key,
        Accept: "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err: any) {
    throw new YoungPgError(
      "Could not reach YoungPG Media" + (opts.isPurchase ? " (purchase status unknown)" : ""),
      0,
      err?.message,
      !!opts.isPurchase
    );
  }

  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    // non-JSON response
  }

  if (!res.ok || !json?.success) {
    const retryAfter = res.headers.get("Retry-After");
    const message =
      json?.message ||
      (res.status === 429 && retryAfter ? `Rate limited, retry in ${retryAfter}s` : `YoungPG error ${res.status}`);
    // 5xx on purchase (e.g. 502 delivery unavailable): the order may or may not exist.
    throw new YoungPgError(message, res.status, json?.errors, !!opts.isPurchase && res.status >= 500);
  }

  return { data: json.data as T, meta: json.meta };
}

// ---- Wallet ----

export async function getBalance(): Promise<{ balance_ngn: string }> {
  return (await request<{ balance_ngn: string }>("GET", "/user/balance")).data;
}

// ---- Catalog ----

export async function listCategories() {
  return (await request<unknown[]>("GET", "/categories")).data;
}

export async function listSubcategories(categoryId: string | number) {
  return (await request<unknown[]>("GET", `/categories/${categoryId}/subcategories`)).data;
}

export async function listListings(query: ListingsQuery = {}) {
  return request<YpgListing[]>("GET", "/listings", { query });
}

export async function getListing(slug: string) {
  return (await request<YpgListing>("GET", `/listings/${encodeURIComponent(slug)}`)).data;
}

// ---- Orders ----

/**
 * Buys accounts. Debits YOUR YoungPG wallet and returns credentials immediately.
 * Not retry-safe: on a YoungPgError with uncertain === true, call listOrders()
 * to see whether the order landed before trying again. Limit: 10 requests/min.
 */
export async function purchase(params: {
  slug: string;
  quantity: number;
  promoCode?: string;
}): Promise<YpgPurchase> {
  const body: Record<string, unknown> = { slug: params.slug, quantity: params.quantity };
  if (params.promoCode) body.promo_code = params.promoCode;
  return (await request<YpgPurchase>("POST", "/purchase", { body, isPurchase: true })).data;
}

export async function listOrders(query: { page?: number; per_page?: number } = {}) {
  return request<unknown[]>("GET", "/orders", { query });
}

export async function getOrder(id: string | number) {
  return (await request<unknown>("GET", `/orders/${id}`)).data;
}
