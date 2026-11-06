import { Router } from "express";
import { getAccount, updateAccount, deleteAccount } from "../controllers/account.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getAccount);
router.patch("/", requireAuth, updateAccount);
router.delete("/", requireAuth, deleteAccount);

export default router;
