// src/routes/catalog.routes.ts
import { Router } from "express";
import {
  getCategories,
  getCatalog,
  getCatalogItem,
  purchaseAccounts,
  getMyOrders,
  getMyOrder,
} from "../controllers/catalog.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Orders (login required). Keep these above "/:slug" so "orders" isn't read as a slug.
router.get("/orders", requireAuth, getMyOrders);
router.get("/orders/:id", requireAuth, getMyOrder);
router.post("/purchase", requireAuth, purchaseAccounts);

// Browse (public). Add requireAuth here if the catalog should need a login.
router.get("/categories", getCategories);
router.get("/", getCatalog);
router.get("/:slug", getCatalogItem);

export default router;
