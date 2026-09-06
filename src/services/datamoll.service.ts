import { DatamollProviderClient } from "@datamoll/provider-sdk";

const apiKey = process.env.DATAMOLL_PROVIDER_API_KEY;
const apiSecret = process.env.DATAMOLL_PROVIDER_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error("Set DATAMOLL_PROVIDER_API_KEY and DATAMOLL_PROVIDER_API_SECRET");
}

export const datamoll = new DatamollProviderClient({
  apiKey,
  apiSecret,
  defaultLanguage: "en",
});