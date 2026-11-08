"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
var express_1 = require("express");
var catalog_routes_1 = require("./routes/catalog.routes");
var auth_routes_1 = require("./routes/auth.routes");
var auth_middleware_1 = require("./middleware/auth.middleware");
var cors_1 = require("cors");
var listings_routes_1 = require("./routes/listings.routes");
var helmet_1 = require("helmet");
var express_rate_limit_1 = require("express-rate-limit");
require("dotenv/config");
var zod_1 = require("zod");
var db_1 = require("./db");
var schema_1 = require("./db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var paystack_service_1 = require("./services/paystack.service");
var wallet_routes_1 = require("./routes/wallet.routes");
var account_routes_1 = require("./routes/account.routes");
var app = (0, express_1.default)();
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use("/api/wallet", wallet_routes_1.default);
/**
 * Marks a deposit as paid and adds it to the user's balance, exactly once.
 * Used by both the Paystack webhook and the "verify" check after the user returns from checkout.
 */
function creditDeposit(reference, paidKobo, currency) {
    return __awaiter(this, void 0, Promise, function () {
        var txn, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!zod_1.z.string().uuid().safeParse(reference).success)
                        return [2 /*return*/, "ignored"];
                    if (currency && currency !== "NGN")
                        return [2 /*return*/, "ignored"];
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.transactions)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.transactions.id, reference), (0, drizzle_orm_1.eq)(schema_1.transactions.type, "deposit")))];
                case 1:
                    txn = (_a.sent())[0];
                    if (!txn)
                        return [2 /*return*/, "ignored"];
                    if (txn.status === "completed")
                        return [2 /*return*/, "completed"]; // already credited
                    if (paidKobo !== txn.amount) {
                        console.error("Paystack amount mismatch for ".concat(reference, ": paid ").concat(paidKobo, ", expected ").concat(txn.amount));
                        return [2 /*return*/, "mismatch"];
                    }
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.transactions)
                            .set({ status: "completed" })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.transactions.id, reference), (0, drizzle_orm_1.ne)(schema_1.transactions.status, "completed")))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    if (!updated) return [3 /*break*/, 4];
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.users)
                            .set({ balance: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " + ", ""], ["", " + ", ""])), schema_1.users.balance, updated.amount) })
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, updated.userId))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, "completed"];
            }
        });
    });
}
// Paystack webhook. Needs the raw body to check the signature, so it comes before express.json().
app.post("/webhooks/paystack", express_1.default.raw({ type: "application/json" }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var signature, event, err_1;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 3, , 4]);
                signature = req.get("x-paystack-signature");
                if (!signature || !(0, paystack_service_1.verifyPaystackSignature)(signature, req.body)) {
                    return [2 /*return*/, res.status(400).json({ error: "Invalid signature" })];
                }
                event = JSON.parse(req.body.toString("utf8"));
                console.log("Paystack webhook event:", event.event, (_a = event.data) === null || _a === void 0 ? void 0 : _a.reference);
                if (!(event.event === "charge.success")) return [3 /*break*/, 2];
                return [4 /*yield*/, creditDeposit(String((_c = (_b = event.data) === null || _b === void 0 ? void 0 : _b.reference) !== null && _c !== void 0 ? _c : ""), Number((_d = event.data) === null || _d === void 0 ? void 0 : _d.amount), (_e = event.data) === null || _e === void 0 ? void 0 : _e.currency)];
            case 1:
                _f.sent();
                _f.label = 2;
            case 2:
                res.status(200).json({ received: true });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _f.sent();
                console.error("Paystack webhook failed:", err_1);
                res.status(500).json({ error: "Webhook failed" }); // Paystack will retry
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.use(express_1.default.json());
app.use("/api/catalog", catalog_routes_1.default);
app.use("/api/account", account_routes_1.default);
app.use((0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100 }));
app.get("/health", function (req, res) {
    res.json({ status: "ok" });
});
var PORT = process.env.PORT || 3000;
app.use("/api/auth", auth_routes_1.default);
app.use("/api/listings", listings_routes_1.default);
app.get("/api/me", auth_middleware_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId))];
            case 1:
                user = (_a.sent())[0];
                if (!user)
                    return [2 /*return*/, res.status(404).json({ error: "User not found" })];
                res.json({ id: user.id, email: user.email, firstName: user.firstName, balance: user.balance });
                return [2 /*return*/];
        }
    });
}); });
// Start a deposit: record it as pending, then send the user to Paystack's checkout page.
app.post("/api/wallet/fund", auth_middleware_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var amountNaira, user, amountKobo, txn, frontend, session, err_2, err_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, , 10]);
                amountNaira = Number(req.body.amount);
                if (!amountNaira || amountNaira < 100) {
                    return [2 /*return*/, res.status(400).json({ error: "Minimum deposit is ₦100" })];
                }
                return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId))];
            case 1:
                user = (_b.sent())[0];
                if (!user)
                    return [2 /*return*/, res.status(404).json({ error: "User not found" })];
                amountKobo = Math.round(amountNaira * 100);
                return [4 /*yield*/, db_1.db
                        .insert(schema_1.transactions)
                        .values({
                        userId: req.userId,
                        type: "deposit",
                        amount: amountKobo,
                        status: "pending",
                    })
                        .returning()];
            case 2:
                txn = (_b.sent())[0];
                _b.label = 3;
            case 3:
                _b.trys.push([3, 6, , 8]);
                frontend = (_a = process.env.FRONTEND_URL) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, "");
                return [4 /*yield*/, (0, paystack_service_1.initializeTransaction)({
                        email: user.email,
                        amountKobo: amountKobo,
                        reference: txn.id,
                        callbackUrl: frontend ? "".concat(frontend, "/wallet") : undefined,
                    })];
            case 4:
                session = _b.sent();
                return [4 /*yield*/, db_1.db.update(schema_1.transactions).set({ externalId: session.access_code }).where((0, drizzle_orm_1.eq)(schema_1.transactions.id, txn.id))];
            case 5:
                _b.sent();
                res.json({ checkout_url: session.authorization_url });
                return [3 /*break*/, 8];
            case 6:
                err_2 = _b.sent();
                return [4 /*yield*/, db_1.db.update(schema_1.transactions).set({ status: "failed" }).where((0, drizzle_orm_1.eq)(schema_1.transactions.id, txn.id))];
            case 7:
                _b.sent();
                throw err_2;
            case 8: return [3 /*break*/, 10];
            case 9:
                err_3 = _b.sent();
                console.error("Failed to start payment:", err_3);
                res.status(500).json({
                    error: "Failed to start payment",
                    detail: (err_3 === null || err_3 === void 0 ? void 0 : err_3.message) || String(err_3),
                });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
// Called when the user comes back from Paystack: confirms the payment with Paystack and credits it.
app.get("/api/wallet/verify", auth_middleware_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ref, txn, data, result, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ref = zod_1.z.string().uuid().safeParse(req.query.reference);
                if (!ref.success)
                    return [2 /*return*/, res.status(400).json({ error: "Invalid reference" })];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 8, , 9]);
                return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.transactions)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.transactions.id, ref.data), (0, drizzle_orm_1.eq)(schema_1.transactions.userId, req.userId), (0, drizzle_orm_1.eq)(schema_1.transactions.type, "deposit")))];
            case 2:
                txn = (_a.sent())[0];
                if (!txn)
                    return [2 /*return*/, res.status(404).json({ error: "Payment not found" })];
                if (txn.status === "completed")
                    return [2 /*return*/, res.json({ status: "completed" })];
                return [4 /*yield*/, (0, paystack_service_1.verifyTransaction)(ref.data)];
            case 3:
                data = _a.sent();
                if (!(data.status === "success")) return [3 /*break*/, 5];
                return [4 /*yield*/, creditDeposit(ref.data, data.amount, data.currency)];
            case 4:
                result = _a.sent();
                return [2 /*return*/, res.json({ status: result === "completed" ? "completed" : "pending" })];
            case 5:
                if (!(data.status === "failed")) return [3 /*break*/, 7];
                return [4 /*yield*/, db_1.db
                        .update(schema_1.transactions)
                        .set({ status: "failed" })
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.transactions.id, ref.data), (0, drizzle_orm_1.eq)(schema_1.transactions.status, "pending")))];
            case 6:
                _a.sent();
                return [2 /*return*/, res.json({ status: "failed" })];
            case 7:
                res.json({ status: "pending" });
                return [3 /*break*/, 9];
            case 8:
                err_4 = _a.sent();
                console.error("Payment verify failed:", err_4);
                res.status(502).json({ error: "Could not confirm the payment right now" });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
var templateObject_1;
