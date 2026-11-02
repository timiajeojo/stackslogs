"use strict";
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
function getWallet(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var user, rows, completed, totalDeposit, totalSpent, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, db_1.db
                            .select({ balance: schema_1.users.balance })
                            .from(schema_1.users)
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId))];
                case 1:
                    user = (_a.sent())[0];
                    if (!user)
                        return [2 /*return*/, res.status(404).json({ error: "User not found" })];
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.transactions)
                            .where((0, drizzle_orm_1.eq)(schema_1.transactions.userId, req.userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.transactions.createdAt))];
                case 2:
                    rows = _a.sent();
                    completed = rows.filter(function (t) { return t.status === "completed"; });
                    totalDeposit = completed
                        .filter(function (t) { return t.type === "deposit"; })
                        .reduce(function (sum, t) { return sum + t.amount; }, 0);
                    totalSpent = completed
                        .filter(function (t) { return t.amount < 0; })
                        .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
                    // Shape matches what app/wallet/page.tsx expects.
                    res.json({
                        balance: user.balance,
                        total_deposit: totalDeposit,
                        total_spent: totalSpent,
                        transactions: rows.slice(0, 50).map(function (t) {
                            var isPurchase = t.amount < 0;
                            return {
                                id: t.id,
                                type: isPurchase ? "purchase" : "deposit",
                                status: t.status === "completed" ? "success" : t.status,
                                amount: Math.abs(t.amount),
                                description: isPurchase ? "Purchase" : "Wallet deposit",
                                created_at: t.createdAt,
                            };
                        }),
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error(err_1);
                    res.status(500).json({ error: "Failed to load wallet" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getWallet = getWallet;
