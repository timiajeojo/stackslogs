import { Router } from "express";
import { getWallet } from "../controllers/wallet.controller";
import { requireAuth } from "../middleware/auth"; // fix this line, see below

const router = Router();

router.get("/", requireAuth, getWallet);

export default router;