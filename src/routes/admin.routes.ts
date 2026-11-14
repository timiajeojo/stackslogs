import { Router } from "express";
import { requireAdmin } from "../middleware/admin.middleware";
import {
  addTopup,
  deleteTopup,
  getPurchases,
  getStats,
  getTransactions,
  getUsers,
  getYpg,
  listTopups,
} from "../controllers/admin.controller";

const router = Router();

// Everything under /api/admin is for admins only.
router.use(requireAdmin);

router.get("/stats", getStats);
router.get("/transactions", getTransactions);
router.get("/users", getUsers);
router.get("/purchases", getPurchases);
router.get("/ypg", getYpg);
router.get("/topups", listTopups);
router.post("/topups", addTopup);
router.delete("/topups/:id", deleteTopup);

export default router;
