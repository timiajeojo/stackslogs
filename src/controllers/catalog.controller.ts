// src/controllers/catalog.controller.ts
import { Request, Response } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users, transactions, supplierOrders } from "../db/schema";
import { AuthRequest } from "../middleware/auth.middleware";
import { encrypt, decrypt } from "../utils/crypto";
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
  toStorefrontListing,
} from "../services/youngpg.service";

// ---- tiny in-memory cache (keeps us under YoungPG's 60 requests/min limit) ----
const cache = new Map<string, { exp: number; val: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.val as T;
  const val = await fn();
  cache.set(key, { exp: Date.now() + ttlMs, val });
  return val;
}

function browseError(res: Response, err: unknown) {
  if (err instanceof YoungPgError && err.status === 404) {
    return res.status(404).json({ error: "Product not found" });
  }
  console.error("Catalog error:", err);
  return res.status(502).json({ error: "Catalog is temporarily unavailable" });
}

// ---- Browse (public) ----

type Cat = { id: string | number; name: string };

// YoungPG's exact category field names aren't documented, so accept the likely ones.
function normCat(raw: any): Cat | null {
  const id = raw?.id ?? raw?.category_id ?? raw?.subcategory_id;
  const name = raw?.name ?? raw?.title ?? raw?.label;
  return id === undefined || id === null || !name ? null : { id, name: String(name) };
}

export async function getCategories(_req: Request, res: Response) {
  try {
    const categories = await cached("categories", 10 * 60_000, async () => {
      const top = ((await listCategories()) as any[])
        .map(normCat)
        .filter((c): c is Cat => c !== null)
        .slice(0, 40);

      return Promise.all(
        top.map(async (c) => {
          try {
            const subs = ((await listSubcategories(c.id)) as any[])
              .map(normCat)
              .filter((x): x is Cat => x !== null);
            return { ...c, subcategories: subs };
          } catch {
            return { ...c, subcategories: [] as Cat[] };
          }
        })
      );
    });
    res.json({ categories });
  } catch (err) {
    browseError(res, err);
  }
}

export async function getCatalog(req: Request, res: Response) {
  const q = req.query;
  const sorts = ["sort_key", "total_price", "available_stock", "title"] as const;

  const query: ListingsQuery = {
    category_id: q.category_id as string | undefined,
    subcategory_id: q.subcategory_id as string | undefined,
    search: q.search as string | undefined,
    sort: sorts.includes(q.sort as any) ? (q.sort as ListingsQuery["sort"]) : undefined,
    direction: q.direction === "desc" ? "desc" : q.direction === "asc" ? "asc" : undefined,
    per_page: Math.min(Math.max(Number(q.per_page) || 24, 1), 100),
    page: Math.max(Number(q.page) || 1, 1),
  };

  try {
    const { data, meta } = await cached(`list:${JSON.stringify(query)}`, 60_000, () =>
      listListings(query)
    );
    res.json({ listings: data.map(toStorefrontListing), meta });
  } catch (err) {
    browseError(res, err);
  }
}

export async function getCatalogItem(req: Request, res: Response) {
  const slug = String(req.params.slug);
  try {
    const listing = await cached(`item:${slug}`, 30_000, () => getListing(slug));
    res.json(toStorefrontListing(listing));
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

  // 1. Price is always taken from the supplier at purchase time, never from the browser.
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
