"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWallet = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var db_1 = require("../db");
var schema_1 = require("../db/schema");
// A deposit that is still "pending" after this long is shown as "abandoned" (the user left checkout).
// If the payment is confirmed later, the status simply becomes "completed".
var ABANDON_AFTER_MINUTES = 30;
/**
 * GET /api/wallet?page=1&limit=10
 * Returns the user's balance, lifetime totals (deposits and purchases) and one page of transactions.
 * All amounts are in kobo.
 */
function getWallet(req, res) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function () {
        var userId, page, limit, user, agg, rows, cutoff_1, shown, total, err_1;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 4, , 5]);
                    userId = req.userId;
                    page = Math.max(parseInt(String((_a = req.query.page) !== null && _a !== void 0 ? _a : "1"), 10) || 1, 1);
                    limit = Math.min(Math.max(parseInt(String((_b = req.query.limit) !== null && _b !== void 0 ? _b : "10"), 10) || 10, 1), 50);
                    return [4 /*yield*/, db_1.db.select({ balance: schema_1.users.balance }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))];
                case 1:
                    user = (_f.sent())[0];
                    if (!user)
                        return [2 /*return*/, res.status(404).json({ error: "User not found" })];
                    return [4 /*yield*/, db_1.db
                            .select({
                            total: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["count(*)::int"], ["count(*)::int"]))),
                            deposits: (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["coalesce(sum(case when ", " = 'deposit' and ", " = 'completed' then ", " else 0 end), 0)::float8"], ["coalesce(sum(case when ", " = 'deposit' and ", " = 'completed' then ", " else 0 end), 0)::float8"])), schema_1.transactions.type, schema_1.transactions.status, schema_1.transactions.amount),
                            spent: (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["coalesce(sum(case when ", " = 'completed' and ", " < 0 then -", " else 0 end), 0)::float8"], ["coalesce(sum(case when ", " = 'completed' and ", " < 0 then -", " else 0 end), 0)::float8"])), schema_1.transactions.status, schema_1.transactions.amount, schema_1.transactions.amount),
                        })
                            .from(schema_1.transactions)
                            .where((0, drizzle_orm_1.eq)(schema_1.transactions.userId, userId))];
                case 2:
                    agg = (_f.sent())[0];
                    return [4 /*yield*/, db_1.db
                            .select({
                            id: schema_1.transactions.id,
                            type: schema_1.transactions.type,
                            amount: schema_1.transactions.amount,
                            status: schema_1.transactions.status,
                            createdAt: schema_1.transactions.createdAt,
                        })
                            .from(schema_1.transactions)
                            .where((0, drizzle_orm_1.eq)(schema_1.transactions.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.transactions.createdAt))
                            .limit(limit)
                            .offset((page - 1) * limit)];
                case 3:
                    rows = _f.sent();
                    cutoff_1 = Date.now() - ABANDON_AFTER_MINUTES * 60000;
                    shown = rows.map(function (r) {
                        return r.type === "deposit" && r.status === "pending" && new Date(r.createdAt).getTime() < cutoff_1
                            ? __assign(__assign({}, r), { status: "abandoned" }) : r;
                    });
                    total = Number((_c = agg === null || agg === void 0 ? void 0 : agg.total) !== null && _c !== void 0 ? _c : 0);
                    res.json({
                        balance: Number(user.balance),
                        totalDeposits: Number((_d = agg === null || agg === void 0 ? void 0 : agg.deposits) !== null && _d !== void 0 ? _d : 0),
                        totalSpent: Number((_e = agg === null || agg === void 0 ? void 0 : agg.spent) !== null && _e !== void 0 ? _e : 0),
                        transactions: shown,
                        page: page,
                        limit: limit,
                        total: total,
                        totalPages: Math.max(Math.ceil(total / limit), 1),
                    });
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _f.sent();
                    console.error("getWallet failed:", err_1);
                    res.status(500).json({ error: "Failed to load wallet" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.getWallet = getWallet;
var templateObject_1, templateObject_2, templateObject_3;
