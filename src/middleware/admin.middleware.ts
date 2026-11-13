import { Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { requireAuth, AuthRequest } from "./auth.middleware";

/**
 * Signed in AND flagged as an admin in the database (users.is_admin = true).
 * The flag is checked on every request, so removing it takes effect immediately.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    try {
      const [user] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, req.userId!));
      if (!user?.isAdmin) return res.status(403).json({ error: "Admins only" });
      next();
    } catch (err) {
      console.error("requireAdmin failed:", err);
      res.status(500).json({ error: "Could not check admin access" });
    }
  });
}
