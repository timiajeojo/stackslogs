import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createListingSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "twitter", "youtube", "other"]),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  followers: z.number().int().positive(),
  price: z.number().int().positive(), // in cents
});