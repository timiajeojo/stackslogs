import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function check() {
  const result = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions'`
  );
  console.log(result.rows);
}

check().then(() => process.exit(0));
