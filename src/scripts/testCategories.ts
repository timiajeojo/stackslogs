import "dotenv/config";
import { getDatamollClient } from "../services/datamoll.service";

async function test() {
  const datamoll = await getDatamollClient();
  const { data } = await datamoll.listCatalog({ language: "en", only_in_stock: true });
  const categories = [...new Set(data.items.map((item: any) => item.category))];
  console.log(JSON.stringify(categories, null, 2));
}

test().catch(console.error);