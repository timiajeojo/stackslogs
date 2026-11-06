import { Response } from "express";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { AuthRequest } from "../middleware/auth.middleware";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  phone: z.string().trim().max(30).optional(),
});

// Digits, spaces, +, -, ( and ) only, with at least 7 digits.
function cleanPhone(raw: string | undefined): string | null | "invalid" {
  const p = (raw ?? "").trim();
  if (!p) return null;
  if (!/^[+0-9\s()-]+$/.test(p)) return "invalid";
  if (p.replace(/\D/g, "").length < 7) return "invalid";
  return p;
}

const profileColumns = {
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  phone: users.phone,
};

/** GET /api/account: the signed-in user's profile. */
export async function getAccount(req: AuthRequest, res: Response) {
  try {
    const [me] = await db.select(profileColumns).from(users).where(eq(users.id, req.userId!));
    if (!me) return res.status(404).json({ error: "User not found" });
    res.json(me);
  } catch (err) {
    console.error("getAccount failed:", err);
    res.status(500).json({ error: "Failed to load account" });
  }
}

/** PATCH /api/account: update first name, last name and phone. The email can't be changed. */
export async function updateAccount(req: AuthRequest, res: Response) {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Invalid details";
    return res.status(400).json({ error: msg });
  }
  const phone = cleanPhone(parsed.data.phone);
  if (phone === "invalid") {
    return res.status(400).json({ error: "Enter a valid phone number" });
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ firstName: parsed.data.firstName, lastName: parsed.data.lastName, phone })
      .where(eq(users.id, req.userId!))
      .returning(profileColumns);
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (err) {
    console.error("updateAccount failed:", err);
    res.status(500).json({ error: "Failed to save changes" });
  }
}

// A bcrypt-shaped hash nobody knows the password for, so a deleted account can never log in.
function unusablePasswordHash() {
  const chars = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(53);
  let out = "$2b$10$";
  for (let i = 0; i < 53; i++) out += chars[bytes[i] % chars.length];
  return out;
}

/**
 * DELETE /api/account
 * Removes the user's personal details and closes the account. The row is kept, anonymised, because
 * order and payment records must stay linked to it for your accounting. The email is freed up so
 * the person can sign up again later.
 */
export async function deleteAccount(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  try {
    const result = await db
      .update(users)
      .set({
        email: `deleted-${userId}@deleted.invalid`,
        firstName: null,
        lastName: null,
        phone: null,
        passwordHash: unusablePasswordHash(),
        balance: 0,
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    if (result.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteAccount failed:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
}
