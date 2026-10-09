import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function run() {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  await db.execute(sql`
    ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS status transaction_status NOT NULL DEFAULT 'completed';
  `);
  await db.execute(sql`
    ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS external_id varchar(255);
  `);
  console.log("Done");
}

run().then(() => process.exit(0));
