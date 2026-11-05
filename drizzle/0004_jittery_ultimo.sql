CREATE TYPE "public"."supplier_order_status" AS ENUM('processing', 'completed', 'failed', 'needs_review');--> statement-breakpoint
CREATE TABLE "supplier_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"supplier_slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"price_paid" integer NOT NULL,
	"cost_kobo" integer NOT NULL,
	"supplier_order_id" varchar(255),
	"encrypted_accounts" text,
	"status" "supplier_order_status" DEFAULT 'processing' NOT NULL,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;