require("dotenv").config();
const fs = require("fs");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);
const file = fs.readFileSync("drizzle/0004_jittery_ultimo.sql", "utf8");
const statements = file
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((s) => /supplier_order|needs_review/.test(s));

const short = (s) => s.slice(0, 70).replace(/\s+/g, " ");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log("Statements to run:", statements.length);
  for (const s of statements) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await sql.query(s);
        console.log("OK  ", short(s));
        break;
      } catch (e) {
        if (/already exists/i.test(e.message)) {
          console.log("SKIP", short(s), "(already exists)");
          break;
        }
        if (attempt === 3) console.log("FAIL", short(s), "->", e.message);
        else await wait(2000);
      }
    }
  }
  const r = await sql.query("select to_regclass('public.supplier_orders') as t");
  console.log("Table check:", JSON.stringify(r));
})();
