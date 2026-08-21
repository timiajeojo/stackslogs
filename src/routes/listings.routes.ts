import { Router } from "express";
import { createListing, getListings, getListingById } from "../controllers/listings.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getListings);
router.get("/:id", getListingById);
router.post("/", requireAuth, createListing);

export default router;
