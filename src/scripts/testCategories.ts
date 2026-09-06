import "dotenv/config";
import { getDatamollClient } from "../services/datamoll.service";

async function test() {
  const datamoll = await getDatamollClient();
  const { data } = await datamoll.listCatalog({ language: "en", only_in_stock: true });
  console.log(JSON.stringify(data.items?.[0], null, 2));
  console.log("Total items:", data.items?.length);
  console.log("Top-level keys:", Object.keys(data));
}

test().catch(console.error);