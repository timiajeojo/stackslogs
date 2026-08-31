import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../services/auth.service";
import { registerSchema, loginSchema } from "../utils/validators";

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
  .insert(users)
  .values({ email, passwordHash, firstName, lastName })
  .returning({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName });

  const token = generateToken(user.id);
  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password, firstName, lastName } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user.id);
  res.json({ user: { id: user.id, email: user.email }, token });
}
