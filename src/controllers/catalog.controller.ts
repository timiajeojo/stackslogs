// src/controllers/catalog.controller.ts
//
// Display-only YoungPG catalogue.
// This controller intentionally does not purchase products, debit wallets,
// create orders, retrieve orders, or return passwords/tokens/cookies/credentials.
//
// A category must explicitly set `enabled: true` in storefront.ts and contain
// a curated `items` array. Broad supplier-category imports are not displayed.
// This keeps the public catalogue limited to products reviewed for eligibility.

import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { STOREFRONT } from "../config/storefront";
import {
  YoungPgError,
  ListingsQuery,
  YpgListing,
  listListings,
  sellPriceKobo,
} from "../services/youngpg.service";

type StoreProduct = {
  slug: string;
  title: string;
  available_stock: number;
  price: number;
};

type StoreCategory = {
  key: string;
  name: string;
  items: StoreProduct[];
};

type BuiltStorefront = {
  fetched: number;
  categories: StoreCategory[];
  problems: string[];
};

// Cache supplier requests so visitors share the same in-flight request.
const cache = new Map<string, { expiresAt: number; promise: Promise<unknown> }>();

function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = cache.get(key);

  if (existing && existing.expiresAt > Date.now()) {
    return existing.promise as Promise<T>;
  }

  const promise = fetcher();
  cache.set(key, { expiresAt: Date.now() + ttlMs, promise });

  promise.catch(() => {
    cache.delete(key);
  });

  return promise;
}

function normaliseTitle(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function supplierTitle(listing: YpgListing): string {
  const raw = listing as any;
  return String(raw.title ?? raw.name ?? "").trim();
}

function safeText(value: unknown, maxLength = 240): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

/**
 * Fetch all supplier listing pages.
 * Stops on an empty page or repeated first slug in case the supplier ignores
 * the page parameter.
 */
async function fetchAllListings(query: ListingsQuery = {}): Promise<YpgListing[]> {
  const listings = new Map<string, YpgListing>();
  let previousFirstSlug = "";

  for (let page = 1; page <= 30; page += 1) {
    const response = await listListings({
      ...query,
      page,
      per_page: 100,
    });

    const rows = Array.isArray(response.data) ? response.data : [];
    if (rows.length === 0) break;

    const firstSlug = String(rows[0]?.slug ?? "");
    if (!firstSlug || firstSlug === previousFirstSlug) break;

    previousFirstSlug = firstSlug;

    for (const listing of rows) {
      if (listing?.slug) listings.set(String(listing.slug), listing);
    }

    if (rows.length < 100) break;
  }

  return [...listings.values()];
}

function toStoreProduct(listing: YpgListing): StoreProduct | null {
  const slug = safeText(String(listing.slug ?? ""), 255);
  const title = safeText(supplierTitle(listing), 240);
  const stock = Number(listing.available_stock);
  const price = Number(sellPriceKobo(listing.price_ngn));

  if (
    !slug ||
    !title ||
    !Number.isFinite(stock) ||
    !Number.isFinite(price) ||
    stock < 0 ||
    price < 0
  ) {
    return null;
  }

  // Use the supplier's own title. Do not substitute an unrelated storefront title.
  return {
    slug,
    title,
    available_stock: Math.floor(stock),
    price: Math.round(price),
  };
}

async function buildStorefront(): Promise<BuiltStorefront> {
  const problems: string[] = [];
  const supplierListings = await cached(
    "youngpg-display-listings",
    90_000,
    () => fetchAllListings(),
  );

  const byNormalisedTitle = new Map<string, YpgListing[]>();

  for (const listing of supplierListings) {
    const title = normaliseTitle(supplierTitle(listing));
    if (!title) continue;

    const matches = byNormalisedTitle.get(title) ?? [];
    matches.push(listing);
    byNormalisedTitle.set(title, matches);
  }

  const categories: StoreCategory[] = [];

  for (const rawCategory of STOREFRONT as unknown as Array<Record<string, any>>) {
    // Fail closed: existing categories remain hidden until explicitly reviewed
    // and enabled in storefront.ts.
    if (rawCategory.enabled !== true) continue;

    const key = safeText(rawCategory.key, 80);
    const name = safeText(rawCategory.name, 100);

    // Only curated, explicitly named listings are allowed. Do not expose every
    // listing from a supplier category automatically.
    if (!key || !name || !Array.isArray(rawCategory.items)) continue;

    const items = new Map<string, StoreProduct>();

    for (const configuredItem of rawCategory.items) {
      const wantedTitle = safeText(configuredItem?.title, 240);
      const wanted = normaliseTitle(wantedTitle);

      if (!wanted) continue;

      const matches = byNormalisedTitle.get(wanted) ?? [];

      if (matches.length !== 1) {
        problems.push(
          matches.length === 0
            ? `${name}: supplier listing not found for "${wantedTitle}"`
            : `${name}: supplier title is ambiguous for "${wantedTitle}"`,
        );
        continue;
      }

      const product = toStoreProduct(matches[0]);
      if (product) items.set(product.slug, product);
    }

    if (items.size > 0) {
      categories.push({
        key,
        name,
        items: [...items.values()],
      });
    }
  }

  if (problems.length > 0) {
    console.warn("YoungPG display catalogue matching issues:\n" + problems.join("\n"));
  }

  return {
    fetched: supplierListings.length,
    categories,
    problems,
  };
}

function getStorefront(): Promise<BuiltStorefront> {
  return cached("youngpg-display-storefront", 90_000, buildStorefront);
}

function sendUnavailable(res: Response) {
  return res.status(410).json({
    error: "This endpoint is disabled. The catalogue is display-only.",
  });
}

/**
 * GET /api/catalog
 * Public, read-only catalogue response.
 */
export async function getCatalog(_req: Request, res: Response) {
  try {
    const storefront = await getStorefront();
    return res.status(200).json({
      categories: storefront.categories,
    });
  } catch (error) {
    if (error instanceof YoungPgError && error.status === 404) {
      return res.status(404).json({ error: "Catalogue not found" });
    }

    console.error("YoungPG catalogue error:", error);
    return res.status(502).json({
      error: "The catalogue is temporarily unavailable.",
    });
  }
}

/**
 * Compatibility exports for existing routes.
 * These handlers intentionally disable purchase, order and credential delivery.
 */
export async function storefrontCheck(_req: AuthRequest, res: Response) {
  try {
    const storefront = await getStorefront();
    return res.status(200).json({
      fetched: storefront.fetched,
      problems: storefront.problems,
      categories: storefront.categories.map((category) => ({
        name: category.name,
        count: category.items.length,
      })),
    });
  } catch (error) {
    console.error("YoungPG storefront check failed:", error);
    return res.status(502).json({ error: "Catalogue check failed" });
  }
}

export async function purchaseAccounts(_req: AuthRequest, res: Response) {
  return sendUnavailable(res);
}

export async function getMyOrders(_req: AuthRequest, res: Response) {
  return sendUnavailable(res);
}

export async function getMyOrder(_req: AuthRequest, res: Response) {
  return sendUnavailable(res);
}
