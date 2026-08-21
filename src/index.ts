import express from "express";
import authRoutes from "./routes/auth.routes";
import { requireAuth, AuthRequest } from "./middleware/auth.middleware";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";

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
app.get("/api/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ userId: req.userId });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
