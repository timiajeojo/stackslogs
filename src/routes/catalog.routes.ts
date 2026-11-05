// src/routes/catalog.routes.ts
import { Router } from "express";
import {
  getCatalog,
  storefrontCheck,
  purchaseAccounts,
  getMyOrders,
  getMyOrder,
} from "../controllers/catalog.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Login required
router.get("/orders", requireAuth, getMyOrders);
router.get("/orders/:id", requireAuth, getMyOrder);
router.post("/purchase", requireAuth, purchaseAccounts);
router.get("/admin/check", requireAuth, storefrontCheck);

// Public: the curated storefront (add requireAuth if it should need a login)
router.get("/", getCatalog);

export default router;
