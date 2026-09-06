import "dotenv/config";
import { getDatamollClient } from "../services/datamoll.service";

async function test() {
  const datamoll = await getDatamollClient();
  const { data } = await datamoll.listCatalog({ language: "en", only_in_stock: true });
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);