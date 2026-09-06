const apiKey = process.env.DATAMOLL_PROVIDER_API_KEY;
const apiSecret = process.env.DATAMOLL_PROVIDER_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error("Set DATAMOLL_PROVIDER_API_KEY and DATAMOLL_PROVIDER_API_SECRET");
}

let clientPromise: Promise<any> | null = null;

export async function getDatamollClient() {
  if (!clientPromise) {
    clientPromise = import("@datamoll/provider-sdk").then(
      ({ DatamollProviderClient }) =>
        new DatamollProviderClient({
          apiKey: apiKey!,
          apiSecret: apiSecret!,
          defaultLanguage: "en",
        })
    );
  }
  return clientPromise;
}