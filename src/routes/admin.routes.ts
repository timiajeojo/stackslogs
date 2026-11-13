import { Router } from "express";
import { requireAdmin } from "../middleware/admin.middleware";
import { addLedger, deleteLedger, getStats, listLedger } from "../controllers/admin.controller";

const router = Router();

// Everything under /api/admin is for admins only.
router.use(requireAdmin);

router.get("/stats", getStats);
router.get("/ledger", listLedger);
router.post("/ledger", addLedger);
router.delete("/ledger/:id", deleteLedger);

export default router;
