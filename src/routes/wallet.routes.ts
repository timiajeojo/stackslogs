import { Router } from "express";
import { getWallet } from "../controllers/wallet.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// GET /api/wallet. Deposits (POST /api/wallet/fund) and the Bachs webhook
// stay in src/index.ts.
router.get("/", requireAuth, getWallet);

export default router;
