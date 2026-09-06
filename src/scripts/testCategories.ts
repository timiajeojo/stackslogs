import "dotenv/config";
import * as fs from "fs";
import { getDatamollClient } from "../services/datamoll.service";

async function test() {
  const datamoll = await getDatamollClient();
  const { data } = await datamoll.listCatalog({ language: "en", only_in_stock: true });
  fs.writeFileSync("catalog-sample.json", JSON.stringify(data.items?.[0], null, 2));
  console.log("Saved first item to catalog-sample.json");
  console.log("Available client methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(datamoll)));
}

test().catch(console.error);