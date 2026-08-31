import express from "express";
import authRoutes from "./routes/auth.routes";
import { requireAuth, AuthRequest } from "./middleware/auth.middleware";
import cors from "cors";
import listingsRoutes from "./routes/listings.routes";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.get("/api/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, firstName: user.firstName, balance: user.balance });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
