// src/controllers/catalog.controller.ts
import { Request, Response } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users, transactions, supplierOrders } from "../db/schema";
import { AuthRequest } from "../middleware/auth.middleware";
import { encrypt, decrypt } from "../utils/crypto";
import { STOREFRONT } from "../config/storefront";
import {
  YoungPgError,
  ListingsQuery,
  YpgListing,
  YpgPurchase,
  getListing,
  listCategories,
  listSubcategories,
  listListings,
  purchase,
  sellPriceKobo,
  ngnToKobo,
} from "../services/youngpg.service";

// ---- tiny in-memory cache (keeps us under YoungPG's 60 requests/min limit) ----
// Caches the promise itself, so simultaneous visitors share one supplier request.
const cache = new Map<string, { exp: number; p: Promise<unknown> }>();
function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.p as Promise<T>;
  const p = fn();
  cache.set(key, { exp: Date.now() + ttlMs, p });
  p.catch(() => cache.delete(key));
  return p;
}

function browseError(res: Response, err: unknown) {
  if (err instanceof YoungPgError && err.status === 404) {
    return res.status(404).json({ error: "Product not found" });
  }
  console.error("Catalog error:", err);
  return res.status(502).json({ error: "Catalog is temporarily unavailable" });
}

// ---- Curated storefront ----

const norm = (s: string) =>
  s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const titleOf = (p: YpgListing) => String((p as any).title ?? (p as any).name ?? "");

type Cat = { id: string | number; name: string };

// YoungPG's exact category field names aren't documented, so accept the likely ones.
function normCat(raw: any): Cat | null {
  const id = raw?.id ?? raw?.category_id ?? raw?.subcategory_id;
  const name = raw?.name ?? raw?.title ?? raw?.label;
  return id === undefined || id === null || !name ? null : { id, name: String(name) };
}
const notNull = <T,>(x: T | null): x is T => x !== null;

/**
 * Fetches every page of a listings query. Page 1 first, then batches of 4 pages in
 * parallel until a batch adds nothing new (so it works even if YoungPG caps page size).
 */
async function fetchPaged(base: ListingsQuery): Promise<YpgListing[]> {
  const out = new Map<string, YpgListing>();
  const first = await listListings({ ...base, per_page: 100, page: 1 });
  if (!Array.isArray(first.data) || first.data.length === 0) return [];
  first.data.forEach((p) => out.set(p.slug, p));

  for (let page = 2; page <= 40; page += 4) {
    const batch = await Promise.all(
      [page, page + 1, page + 2, page + 3].map((n) =>
        listListings({ ...base, per_page: 100, page: n })
          .then((r) => (Array.isArray(r.data) ? r.data : []))
          .catch(() => [] as YpgListing[])
      )
    );
    const before = out.size;
    batch.forEach((rows) => rows.forEach((p) => out.set(p.slug, p)));
    if (out.size === before) break; // nothing new: we've reached the end
  }
  return [...out.values()];
}

/** Finds a YoungPG category (or subcategory) by any of the given names. */
function resolveSupplierCategory(names: string[]) {
  return cached(`resolve:${names.map(norm).join("|")}`, 30 * 60_000, async () => {
    const targets = names.map(norm);
    const seen: string[] = [];
    const score = (c: Cat) => {
      const n = norm(c.name);
      return targets.includes(n) ? 2 : targets.some((t) => n.includes(t)) ? 1 : 0;
    };
    const pick = (list: Cat[]) =>
      list
        .map((c) => ({ c, s: score(c) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)[0]?.c;

    const top = ((await listCategories()) as any[]).map(normCat).filter(notNull);
    top.forEach((c) => seen.push(c.name));
    const hit = pick(top);
    if (hit) return { ref: { param: "category_id" as const, id: hit.id }, seen };

    // Not a top-level category: look through subcategories, 10 at a time.
    const limited = top.slice(0, 40);
    for (let i = 0; i < limited.length; i += 10) {
      const group = limited.slice(i, i + 10);
      const batch = await Promise.all(
        group.map(async (c) => {
          try {
            return ((await listSubcategories(c.id)) as any[]).map(normCat).filter(notNull);
          } catch {
            return [] as Cat[];
          }
        })
      );
      for (let j = 0; j < batch.length; j++) {
        batch[j].forEach((sc) => seen.push(`${group[j].name} > ${sc.name}`));
        const sc = pick(batch[j]);
        if (sc) return { ref: { param: "subcategory_id" as const, id: sc.id }, seen };
      }
    }
    return { ref: null, seen };
  });
}

/** Exact match on normalized title, else a unique prefix match. */
function findProduct(all: YpgListing[], wanted: string): YpgListing | "ambiguous" | undefined {
  const w = norm(wanted);
  const exact = all.filter((p) => norm(titleOf(p)) === w);
  if (exact.length > 0) return exact.find((p) => p.available_stock > 0) ?? exact[0];

  const loose = all.filter((p) => {
    const t = norm(titleOf(p));
    return t.startsWith(w) || (t.length > 20 && w.startsWith(t));
  });
  if (loose.length === 1) return loose[0];
  return loose.length > 1 ? "ambiguous" : undefined;
}

/** For diagnostics only: the catalog titles most similar to a wanted one (full text). */
function closest(all: YpgListing[], wanted: string): string[] {
  const wt = new Set(norm(wanted).split(" "));
  return all
    .map((p) => {
      const tokens = new Set(norm(titleOf(p)).split(" "));
      let inter = 0;
      wt.forEach((x) => {
        if (tokens.has(x)) inter++;
      });
      return { title: titleOf(p), score: inter / (wt.size + tokens.size - inter) };
    })
    .filter((x) => x.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.title);
}

function isExcluded(title: string, exclude: string[]) {
  const t = norm(title);
  return exclude.some((ex) => {
    const e = norm(ex);
    return t === e || (t.length > 30 && e.length > 30 && (t.startsWith(e) || e.startsWith(t)));
  });
}

type StoreProduct = { slug: string; title: string; available_stock: number; price: number };
type Built = {
  fetched: number;
  categories: { key: string; name: string; items: StoreProduct[] }[];
  slugs: Set<string>;
  problems: string[];
};

function toStoreProduct(p: YpgListing, displayName?: string): StoreProduct {
  return {
    slug: p.slug,
    title: displayName || titleOf(p),
    available_stock: p.available_stock,
    price: sellPriceKobo(p.price_ngn), // kobo, includes your markup; supplier cost is never exposed
  };
}

async function buildStorefront(): Promise<Built> {
  const started = Date.now();
  const problems: string[] = [];
  const all = await cached("all-listings", 90_000, () => fetchPaged({}));
  const categories: Built["categories"] = [];

  for (const cat of STOREFRONT) {
    const items = new Map<string, StoreProduct>();

    if ("items" in cat) {
      for (const wanted of cat.items) {
        const found = findProduct(all, wanted.title);
        if (!found) {
          const near = closest(all, wanted.title);
          problems.push(`${cat.name}: NO MATCH for "${wanted.title}" | closest: ${near.length ? near.map((n) => `"${n}"`).join(" ; ") : "nothing similar"}`);
        } else if (found === "ambiguous") {
          problems.push(`${cat.name}: SEVERAL MATCHES for "${wanted.title}"`);
        } else {
          items.set(found.slug, toStoreProduct(found, wanted.displayName));
        }
      }
    } else {
      try {
        const names = Array.isArray(cat.supplierCategory) ? cat.supplierCategory : [cat.supplierCategory];
        const { ref, seen } = await resolveSupplierCategory(names);
        if (!ref) {
          problems.push(`${cat.name}: YoungPG category "${names.join(" / ")}" not found. Categories seen: ${seen.join("; ")}`);
        } else {
          const list = await cached(`cat:${ref.param}:${ref.id}`, 90_000, () =>
            fetchPaged({ [ref.param]: ref.id } as ListingsQuery)
          );
          list
            .filter((p) => !isExcluded(titleOf(p), cat.exclude))
            .forEach((p) => items.set(p.slug, toStoreProduct(p)));
        }
      } catch (err) {
        problems.push(`${cat.name}: failed to load (${(err as Error).message})`);
      }
    }

    if (items.size > 0) categories.push({ key: cat.key, name: cat.name, items: [...items.values()] });
  }

  if (problems.length) console.warn("Storefront problems:\n" + problems.join("\n"));

  const slugs = new Set(categories.flatMap((c) => c.items.map((i) => i.slug)));
  console.log(`Storefront built in ${Date.now() - started}ms from ${all.length} listings`);
  return { fetched: all.length, categories, slugs, problems };
}

let lastGood: Built | null = null;
let lastBuiltAt = 0;
let building: Promise<Built> | null = null;

/**
 * Serves the storefront from memory. When it is older than 90s it is rebuilt;
 * visitors get the previous version instantly while the rebuild runs in the background.
 */
function getStorefront(): Promise<Built> {
  if (lastGood && Date.now() - lastBuiltAt < 90_000) return Promise.resolve(lastGood);

  if (!building) {
    building = buildStorefront()
      .then((b) => {
        lastGood = b;
        lastBuiltAt = Date.now();
        return b;
      })
      .finally(() => {
        building = null;
      });
  }

  if (lastGood) {
    building.catch((err) => console.error("Storefront refresh failed:", err));
    return Promise.resolve(lastGood);
  }
  return building;
}

// ---- Browse (public) ----

/** Starts building the storefront in the background, so the first visitor doesn't wait for it. */
export function warmStorefront() {
  getStorefront().catch((err) => console.error("Storefront warm-up failed:", err));
}

export async function getCatalog(_req: Request, res: Response) {
  try {
    const built = await getStorefront();
    // Let browsers and the CDN reuse the answer briefly, and serve a slightly old copy while refreshing.
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
    res.json({ categories: built.categories });
  } catch (err) {
    browseError(res, err);
  }
}

/**
 * Diagnostics: shows which configured accounts could not be matched.
 * Open /api/catalog/admin/check?key=YOUR_KEY in a browser, where YOUR_KEY is the
 * STOREFRONT_CHECK_KEY environment variable. Disabled if that variable is not set.
 */
export async function storefrontCheck(req: Request, res: Response) {
  const key = process.env.STOREFRONT_CHECK_KEY;
  if (!key || req.query.key !== key) return res.status(403).json({ error: "Forbidden" });

  try {
    const built = await getStorefront();
    res.json({
      fetched: built.fetched,
      problems: built.problems,
      categories: built.categories.map((c) => ({ name: c.name, count: c.items.length })),
    });
  } catch (err) {
    browseError(res, err);
  }
}

// ---- Purchase ----

const purchaseSchema = z.object({
  slug: z.string().min(1).max(255),
  quantity: z.number().int().min(1).max(50),
});

export async function purchaseAccounts(req: AuthRequest, res: Response) {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }
  const { slug, quantity } = parsed.data;
  const userId = req.userId!;

  // 1. Only accounts on the curated storefront can be bought.
  try {
    const store = await getStorefront();
    if (!store.slugs.has(slug)) return res.status(404).json({ error: "Product not found" });
  } catch (err) {
    return browseError(res, err);
  }

  // Price is always taken from the supplier at purchase time, never from the browser.
  let listing: YpgListing;
  try {
    listing = await getListing(slug);
  } catch (err) {
    return browseError(res, err);
  }

  if (listing.available_stock < quantity) {
    return res.status(400).json({ error: "Not enough stock available" });
  }

  const unitPrice = sellPriceKobo(listing.price_ngn);
  const total = unitPrice * quantity;
  const estimatedCost = ngnToKobo(listing.price_ngn) * quantity;

  // 2. Debit the buyer atomically (only if they can afford it) and record the order.
  const created = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({ balance: sql`${users.balance} - ${total}` })
      .where(and(eq(users.id, userId), gte(users.balance, total)))
      .returning({ balance: users.balance });

    if (!updated) return null;

    const [order] = await tx
      .insert(supplierOrders)
      .values({
        buyerId: userId,
        supplierSlug: slug,
        title: listing.title,
        quantity,
        unitPrice,
        pricePaid: total,
        costKobo: estimatedCost,
        status: "processing",
      })
      .returning();

    const [txn] = await tx
      .insert(transactions)
      .values({
        userId,
        type: "purchase",
        amount: -total,
        status: "pending",
        externalId: order.id,
      })
      .returning();

    return { order, txn, newBalance: updated.balance };
  });

  if (!created) {
    return res.status(402).json({ error: "Insufficient balance. Please fund your wallet." });
  }

  const { order, txn } = created;

  // 3. Buy from the supplier. NOT retry-safe, so we never retry automatically.
  let result: YpgPurchase;
  try {
    result = await purchase({ slug, quantity });
  } catch (err) {
    const uncertain = err instanceof YoungPgError ? err.uncertain : true;
    console.error("YoungPG purchase failed:", err);

    if (uncertain) {
      // Outcome unknown: keep the charge in place and flag for a manual check.
      await db
        .update(supplierOrders)
        .set({ status: "needs_review", failureReason: "Supplier result unknown" })
        .where(eq(supplierOrders.id, order.id));
      return res.status(202).json({
        status: "processing",
        order_id: order.id,
        message: "Your order is being confirmed. Check your orders shortly.",
      });
    }

    // Clean failure: refund the buyer and mark everything failed.
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${total}` })
        .where(eq(users.id, userId));
      await tx.update(transactions).set({ status: "failed" }).where(eq(transactions.id, txn.id));
      await tx
        .update(supplierOrders)
        .set({
          status: "failed",
          failureReason: err instanceof YoungPgError ? `${err.status}: ${err.message}` : "Unknown error",
        })
        .where(eq(supplierOrders.id, order.id));
    });

    if (err instanceof YoungPgError && err.status === 429) {
      return res.status(503).json({ error: "We're busy right now. Please try again in a moment." });
    }
    return res.status(502).json({ error: "This product is temporarily unavailable. You were not charged." });
  }

  // 4. Store the delivered credentials (encrypted) and finalize.
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(supplierOrders)
        .set({
          status: "completed",
          supplierOrderId: String(result.order_id),
          encryptedAccounts: encrypt(JSON.stringify(result.accounts)),
          costKobo: ngnToKobo(result.amount_ngn),
        })
        .where(eq(supplierOrders.id, order.id));
      await tx.update(transactions).set({ status: "completed" }).where(eq(transactions.id, txn.id));
    });
  } catch (err) {
    // The supplier already charged us. The credentials can still be fetched from
    // YoungPG with GET /orders/{id}, so record the supplier order id and flag it.
    console.error("Failed to store credentials for order", order.id, "supplier order", result.order_id, err);
    await db
      .update(supplierOrders)
      .set({
        status: "needs_review",
        supplierOrderId: String(result.order_id),
        failureReason: "Purchased but failed to store credentials",
      })
      .where(eq(supplierOrders.id, order.id))
      .catch(() => {});
    return res.status(202).json({
      status: "processing",
      order_id: order.id,
      message: "Your order is being confirmed. Check your orders shortly.",
    });
  }

  res.status(201).json({
    status: "completed",
    order_id: order.id,
    accounts: result.accounts,
    amount_paid: total,
    new_balance: created.newBalance,
  });
}

// ---- Orders (buyer's own) ----

export async function getMyOrders(req: AuthRequest, res: Response) {
  try {
    const rows = await db
      .select({
        id: supplierOrders.id,
        title: supplierOrders.title,
        quantity: supplierOrders.quantity,
        unit_price: supplierOrders.unitPrice,
        price_paid: supplierOrders.pricePaid,
        status: supplierOrders.status,
        created_at: supplierOrders.createdAt,
      })
      .from(supplierOrders)
      .where(eq(supplierOrders.buyerId, req.userId!))
      .orderBy(desc(supplierOrders.createdAt))
      .limit(100);

    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load orders" });
  }
}

export async function getMyOrder(req: AuthRequest, res: Response) {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(404).json({ error: "Order not found" });

  try {
    const [order] = await db
      .select()
      .from(supplierOrders)
      .where(and(eq(supplierOrders.id, id.data), eq(supplierOrders.buyerId, req.userId!)));

    if (!order) return res.status(404).json({ error: "Order not found" });

    const accounts =
      order.status === "completed" && order.encryptedAccounts
        ? (JSON.parse(decrypt(order.encryptedAccounts)) as string[])
        : [];

    res.json({
      id: order.id,
      title: order.title,
      quantity: order.quantity,
      unit_price: order.unitPrice,
      price_paid: order.pricePaid,
      status: order.status,
      created_at: order.createdAt,
      accounts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load order" });
  }
}
