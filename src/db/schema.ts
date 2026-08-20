import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

// Enums
export const listingStatusEnum = pgEnum("listing_status", ["available", "pending", "sold"]);
export const orderStatusEnum = pgEnum("order_status", ["completed", "refunded", "disputed"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["deposit", "purchase", "refund", "adjustment"]);
export const platformEnum = pgEnum("platform", ["instagram", "tiktok", "twitter", "youtube", "other"]);

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  balance: integer("balance").notNull().default(0), // stored in cents
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Listings (accounts for sale)
export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").notNull().references(() => users.id),
  platform: platformEnum("platform").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  followers: integer("followers").notNull(),
  price: integer("price").notNull(), // in cents
  status: listingStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Account credentials (delivered after purchase — encrypt before storing)
export const accountCredentials = pgTable("account_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id).unique(),
  encryptedUsername: text("encrypted_username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  extraInfo: text("extra_info"), // e.g. recovery email, 2FA notes (encrypted too, ideally)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: uuid("buyer_id").notNull().references(() => users.id),
  listingId: uuid("listing_id").notNull().references(() => listings.id),
  pricePaid: integer("price_paid").notNull(),
  status: orderStatusEnum("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions (wallet ledger)
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(), // positive or negative, in cents
  relatedOrderId: uuid("related_order_id").references(() => orders.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});