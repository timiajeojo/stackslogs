const apiKey = process.env.DATAMOLL_PROVIDER_API_KEY;
const apiSecret = process.env.DATAMOLL_PROVIDER_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error("Set DATAMOLL_PROVIDER_API_KEY and DATAMOLL_PROVIDER_API_SECRET");
}

let clientPromise: Promise<any> | null = null;

const dynamicImport = (specifier: string) =>
  eval(`import("${specifier}")`) as Promise<any>;

export async function getDatamollClient() {
  if (!clientPromise) {
    clientPromise = dynamicImport("@datamoll/provider-sdk").then(
      ({ DatamollProviderClient }: any) =>
        new DatamollProviderClient({ apiKey, apiSecret, defaultLanguage: "en" })
    );
  }
  return clientPromise;
}