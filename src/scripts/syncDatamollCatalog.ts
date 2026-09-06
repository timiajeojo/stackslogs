import "dotenv/config";
import { db } from "../db";
import { listings } from "../db/schema";
import { getDatamollClient } from "../services/datamoll.service";

const platformMap: Record<string, "instagram" | "tiktok" | "twitter" | "youtube" | "other"> = {
  instagram: "instagram",
  tiktok: "tiktok",
  twitter: "twitter",
  x: "twitter",
  youtube: "youtube",
};

async function syncCatalog() {
  const datamoll = await getDatamollClient();
  const { data } = await datamoll.listCatalog({
    language: "en",
    only_in_stock: true,
  });

  for (const item of data.items) {
    const platform = platformMap[item.category?.toLowerCase()] || "other";

    await db.insert(listings).values({
      sellerId: process.env.DATAMOLL_SELLER_ID!, // a placeholder "system" seller user id
      platform,
      title: item.name,
      description: item.description || null,
      followers: item.followers || 0,
      price: Math.round(item.price * 100), // convert to cents if needed
      status: "available",
    });
  }

  console.log(`Synced ${data.items.length} items from Datamoll`);
}

syncCatalog().catch(console.error);