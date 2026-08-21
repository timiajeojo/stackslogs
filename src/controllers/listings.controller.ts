import { Response } from "express";
import { db } from "../db";
import { listings } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { createListingSchema } from "../utils/validators";
import { AuthRequest } from "../middleware/auth.middleware";

export async function createListing(req: AuthRequest, res: Response) {
  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const [listing] = await db
    .insert(listings)
    .values({ ...parsed.data, sellerId: req.userId! })
    .returning();

  res.status(201).json(listing);
}

export async function getListings(req: AuthRequest, res: Response) {
  const results = await db
    .select()
    .from(listings)
    .where(eq(listings.status, "available"));

  res.json(results);
}

export async function getListingById(req: AuthRequest, res: Response) {
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, req.params.id));

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  res.json(listing);
}
