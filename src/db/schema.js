"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactions = exports.orders = exports.accountCredentials = exports.listings = exports.users = exports.platformEnum = exports.transactionStatusEnum = exports.transactionTypeEnum = exports.orderStatusEnum = exports.listingStatusEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// Enums
exports.listingStatusEnum = (0, pg_core_1.pgEnum)("listing_status", ["available", "pending", "sold"]);
exports.orderStatusEnum = (0, pg_core_1.pgEnum)("order_status", ["completed", "refunded", "disputed"]);
exports.transactionTypeEnum = (0, pg_core_1.pgEnum)("transaction_type", ["deposit", "purchase", "refund", "adjustment"]);
exports.transactionStatusEnum = (0, pg_core_1.pgEnum)("transaction_status", ["pending", "completed", "failed"]);
exports.platformEnum = (0, pg_core_1.pgEnum)("platform", ["instagram", "tiktok", "twitter", "youtube", "other"]);
// Users
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    firstName: (0, pg_core_1.varchar)("first_name", { length: 100 }),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 100 }),
    balance: (0, pg_core_1.integer)("balance").notNull().default(0),
    isAdmin: (0, pg_core_1.boolean)("is_admin").notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
// Listings (accounts for sale)
exports.listings = (0, pg_core_1.pgTable)("listings", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    sellerId: (0, pg_core_1.uuid)("seller_id").notNull().references(function () { return exports.users.id; }),
    platform: (0, exports.platformEnum)("platform").notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    followers: (0, pg_core_1.integer)("followers").notNull(),
    price: (0, pg_core_1.integer)("price").notNull(),
    status: (0, exports.listingStatusEnum)("status").notNull().default("available"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
// Account credentials (delivered after purchase — encrypt before storing)
exports.accountCredentials = (0, pg_core_1.pgTable)("account_credentials", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    listingId: (0, pg_core_1.uuid)("listing_id").notNull().references(function () { return exports.listings.id; }).unique(),
    encryptedUsername: (0, pg_core_1.text)("encrypted_username").notNull(),
    encryptedPassword: (0, pg_core_1.text)("encrypted_password").notNull(),
    extraInfo: (0, pg_core_1.text)("extra_info"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
// Orders
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    buyerId: (0, pg_core_1.uuid)("buyer_id").notNull().references(function () { return exports.users.id; }),
    listingId: (0, pg_core_1.uuid)("listing_id").notNull().references(function () { return exports.listings.id; }),
    pricePaid: (0, pg_core_1.integer)("price_paid").notNull(),
    status: (0, exports.orderStatusEnum)("status").notNull().default("completed"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
// Transactions (wallet ledger)
exports.transactions = (0, pg_core_1.pgTable)("transactions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(function () { return exports.users.id; }),
    type: (0, exports.transactionTypeEnum)("type").notNull(),
    amount: (0, pg_core_1.integer)("amount").notNull(),
    status: (0, exports.transactionStatusEnum)("status").notNull().default("completed"),
    externalId: (0, pg_core_1.varchar)("external_id", { length: 255 }),
    relatedOrderId: (0, pg_core_1.uuid)("related_order_id").references(function () { return exports.orders.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
