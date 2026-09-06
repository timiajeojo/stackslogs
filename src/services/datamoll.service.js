"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datamoll = void 0;
var provider_sdk_1 = require("@datamoll/provider-sdk");
var apiKey = process.env.DATAMOLL_PROVIDER_API_KEY;
var apiSecret = process.env.DATAMOLL_PROVIDER_API_SECRET;
if (!apiKey || !apiSecret) {
    throw new Error("Set DATAMOLL_PROVIDER_API_KEY and DATAMOLL_PROVIDER_API_SECRET");
}
exports.datamoll = new provider_sdk_1.DatamollProviderClient({
    apiKey: apiKey,
    apiSecret: apiSecret,
    defaultLanguage: "en",
});
