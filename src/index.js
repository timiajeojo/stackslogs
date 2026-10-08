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
var express_1 = require("express");
var auth_routes_1 = require("./routes/auth.routes");
var auth_middleware_1 = require("./middleware/auth.middleware");
var cors_1 = require("cors");
var listings_routes_1 = require("./routes/listings.routes");
var helmet_1 = require("helmet");
var express_rate_limit_1 = require("express-rate-limit");
require("dotenv/config");
var db_1 = require("./db");
var schema_1 = require("./db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var datamoll_service_1 = require("./services/datamoll.service");
var bachs_service_1 = require("./services/bachs.service");
var app = (0, express_1.default)();
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.post("/webhooks/bachs", express_1.default.raw({ type: "application/json" }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var signature, event, reference, externalId, txnId, match, updated, reference;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    return __generator(this, function (_q) {
        switch (_q.label) {
            case 0:
                signature = req.get("X-Bachs-Signature-V2");
                if (!signature || !(0, bachs_service_1.verifyBachsSignature)(signature, req.body, process.env.BACHS_WEBHOOK_SECRET)) {
                    return [2 /*return*/, res.status(400).json({ error: "Invalid signature" })];
                }
                event = JSON.parse(req.body.toString("utf8"));
                console.log("Bachs webhook event:", JSON.stringify(event, null, 2));
                if (!(event.type === "checkout.completed" || event.type === "collection.succeeded")) return [3 /*break*/, 5];
                reference = (_e = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.reference) !== null && _b !== void 0 ? _b : (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.checkout_session) === null || _d === void 0 ? void 0 : _d.reference) !== null && _e !== void 0 ? _e : (_g = (_f = event.data) === null || _f === void 0 ? void 0 : _f.metadata) === null || _g === void 0 ? void 0 : _g.reference;
                externalId = (_j = (_h = event.data) === null || _h === void 0 ? void 0 : _h.checkout_id) !== null && _j !== void 0 ? _j : (_k = event.data) === null || _k === void 0 ? void 0 : _k.id;
                txnId = reference;
                if (!(!txnId && externalId)) return [3 /*break*/, 2];
                return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.transactions)
                        .where((0, drizzle_orm_1.eq)(schema_1.transactions.externalId, externalId))];
            case 1:
                match = (_q.sent())[0];
                txnId = match === null || match === void 0 ? void 0 : match.id;
                _q.label = 2;
            case 2:
                if (!txnId) return [3 /*break*/, 5];
                return [4 /*yield*/, db_1.db
                        .update(schema_1.transactions)
                        .set({ status: "completed" })
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.transactions.id, txnId), (0, drizzle_orm_1.eq)(schema_1.transactions.status, "pending")))
                        .returning()];
            case 3:
                updated = (_q.sent())[0];
                if (!updated) return [3 /*break*/, 5];
                return [4 /*yield*/, db_1.db
                        .update(schema_1.users)
                        .set({ balance: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " + ", ""], ["", " + ", ""])), schema_1.users.balance, updated.amount) })
                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, updated.userId))];
            case 4:
                _q.sent();
                _q.label = 5;
            case 5:
                if (!(event.type === "checkout.expired" || event.type === "collection.failed")) return [3 /*break*/, 7];
                reference = (_m = (_l = event.data) === null || _l === void 0 ? void 0 : _l.reference) !== null && _m !== void 0 ? _m : (_p = (_o = event.data) === null || _o === void 0 ? void 0 : _o.checkout_session) === null || _p === void 0 ? void 0 : _p.reference;
                if (!reference) return [3 /*break*/, 7];
                return [4 /*yield*/, db_1.db
                        .update(schema_1.transactions)
                        .set({ status: "failed" })
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.transactions.id, reference), (0, drizzle_orm_1.eq)(schema_1.transactions.status, "pending")))];
            case 6:
                _q.sent();
                _q.label = 7;
            case 7:
                res.status(200).json({ received: true });
                return [2 /*return*/];
        }
    });
}); });
app.use(express_1.default.json());
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
app.post("/api/wallet/fund", auth_middleware_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var amountNaira, user, amountKobo, txn, session, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                amountNaira = Number(req.body.amount);
                if (!amountNaira || amountNaira <= 0) {
                    return [2 /*return*/, res.status(400).json({ error: "Invalid amount" })];
                }
                return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId))];
            case 1:
                user = (_a.sent())[0];
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
                txn = (_a.sent())[0];
                return [4 /*yield*/, (0, bachs_service_1.createCheckoutSession)({
                        amountNaira: amountNaira,
                        email: user.email,
                        reference: txn.id,
                    })];
            case 3:
                session = _a.sent();
                return [4 /*yield*/, db_1.db
                        .update(schema_1.transactions)
                        .set({ externalId: session.checkout_id })
                        .where((0, drizzle_orm_1.eq)(schema_1.transactions.id, txn.id))];
            case 4:
                _a.sent();
                res.json({ checkout_url: session.checkout_url });
                return [3 /*break*/, 6];
            case 5:
                err_1 = _a.sent();
                console.error(err_1);
                res.status(500).json({ error: "Failed to start payment" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
app.get("/api/categories", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var datamoll, data, err_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, datamoll_service_1.getDatamollClient)()];
            case 1:
                datamoll = _b.sent();
                return [4 /*yield*/, datamoll.listCategories({ language: "en" })];
            case 2:
                data = (_b.sent()).data;
                res.json(data);
                return [3 /*break*/, 4];
            case 3:
                err_2 = _b.sent();
                console.error(err_2);
                res.status(500).json({
                    error: "Failed to fetch categories",
                    detail: (err_2 === null || err_2 === void 0 ? void 0 : err_2.message) || String(err_2),
                    data: ((_a = err_2 === null || err_2 === void 0 ? void 0 : err_2.response) === null || _a === void 0 ? void 0 : _a.data) || null,
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/catalog", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var datamoll, categoryId, data, err_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, datamoll_service_1.getDatamollClient)()];
            case 1:
                datamoll = _b.sent();
                categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
                return [4 /*yield*/, datamoll.listCatalog(__assign({ language: "en", only_in_stock: true }, (categoryId ? { category_id: categoryId } : {})))];
            case 2:
                data = (_b.sent()).data;
                res.json(data);
                return [3 /*break*/, 4];
            case 3:
                err_3 = _b.sent();
                console.error(err_3);
                res.status(500).json({
                    error: "Failed to fetch catalog",
                    detail: (err_3 === null || err_3 === void 0 ? void 0 : err_3.message) || String(err_3),
                    data: ((_a = err_3 === null || err_3 === void 0 ? void 0 : err_3.response) === null || _a === void 0 ? void 0 : _a.data) || null,
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
var templateObject_1;
