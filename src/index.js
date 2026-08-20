"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var neon_http_1 = require("drizzle-orm/neon-http");
var serverless_1 = require("@neondatabase/serverless");
require("dotenv/config");
var sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
exports.db = (0, neon_http_1.drizzle)(sql);
