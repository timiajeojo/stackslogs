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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrder = exports.getMyOrders = exports.purchaseAccounts = exports.storefrontCheck = exports.getCatalog = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var zod_1 = require("zod");
var db_1 = require("../db");
var schema_1 = require("../db/schema");
var crypto_1 = require("../utils/crypto");
var storefront_1 = require("../config/storefront");
var youngpg_service_1 = require("../services/youngpg.service");
// ---- tiny in-memory cache (keeps us under YoungPG's 60 requests/min limit) ----
// Caches the promise itself, so simultaneous visitors share one supplier request.
var cache = new Map();
function cached(key, ttlMs, fn) {
    var hit = cache.get(key);
    if (hit && hit.exp > Date.now())
        return hit.p;
    var p = fn();
    cache.set(key, { exp: Date.now() + ttlMs, p: p });
    p.catch(function () { return cache.delete(key); });
    return p;
}
function browseError(res, err) {
    if (err instanceof youngpg_service_1.YoungPgError && err.status === 404) {
        return res.status(404).json({ error: "Product not found" });
    }
    console.error("Catalog error:", err);
    return res.status(502).json({ error: "Catalog is temporarily unavailable" });
}
// ---- Curated storefront ----
var norm = function (s) {
    return s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
};
var titleOf = function (p) { var _a, _b; return String((_b = (_a = p.title) !== null && _a !== void 0 ? _a : p.name) !== null && _b !== void 0 ? _b : ""); };
// YoungPG's exact category field names aren't documented, so accept the likely ones.
function normCat(raw) {
    var _a, _b, _c, _d;
    var id = (_b = (_a = raw === null || raw === void 0 ? void 0 : raw.id) !== null && _a !== void 0 ? _a : raw === null || raw === void 0 ? void 0 : raw.category_id) !== null && _b !== void 0 ? _b : raw === null || raw === void 0 ? void 0 : raw.subcategory_id;
    var name = (_d = (_c = raw === null || raw === void 0 ? void 0 : raw.name) !== null && _c !== void 0 ? _c : raw === null || raw === void 0 ? void 0 : raw.title) !== null && _d !== void 0 ? _d : raw === null || raw === void 0 ? void 0 : raw.label;
    return id === undefined || id === null || !name ? null : { id: id, name: String(name) };
}
var notNull = function (x) { return x !== null; };
/** Fetches every page of a listings query. Stops on an empty page, so it works even if YoungPG caps page size below 100. */
function fetchPaged(base) {
    return __awaiter(this, void 0, Promise, function () {
        var out, prevFirst, page, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    out = new Map();
                    prevFirst = "";
                    page = 1;
                    _a.label = 1;
                case 1:
                    if (!(page <= 30)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, youngpg_service_1.listListings)(__assign(__assign({}, base), { per_page: 100, page: page }))];
                case 2:
                    data = (_a.sent()).data;
                    if (!Array.isArray(data) || data.length === 0)
                        return [3 /*break*/, 4];
                    if (data[0].slug === prevFirst)
                        return [3 /*break*/, 4]; // the API ignored `page`
                    prevFirst = data[0].slug;
                    data.forEach(function (p) { return out.set(p.slug, p); });
                    _a.label = 3;
                case 3:
                    page++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, __spreadArray([], out.values(), true)];
            }
        });
    });
}
/** Rejects if the promise takes longer than `ms`, so one slow supplier call can't hang the whole storefront. */
function withTimeout(p, ms, label) {
    return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () { return reject(new Error("".concat(label, " timed out"))); }, ms);
        p.then(function (v) {
            clearTimeout(timer);
            resolve(v);
        }, function (e) {
            clearTimeout(timer);
            reject(e);
        });
    });
}
// "fb" / "faceb00k" -> "facebook" so "Asian Fb" matches "Asian Facebook" and vice versa.
var catNorm = function (s) { return norm(s).replace(/\bfb\b/g, "facebook").replace(/\bfaceb00k\b/g, "facebook"); };
/** Finds a YoungPG category (or subcategory) by name. */
function resolveSupplierCategory(name) {
    var _this = this;
    return cached("resolve:".concat(catNorm(name)), 30 * 60000, function () { return __awaiter(_this, void 0, void 0, function () {
        var target, targetTokens, exact, loose, top, hit, scan, i, results, s;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    target = catNorm(name);
                    targetTokens = target.split(" ");
                    exact = function (c) { return catNorm(c.name) === target; };
                    loose = function (c) {
                        var tokens = new Set(catNorm(c.name).split(" "));
                        return targetTokens.every(function (x) { return tokens.has(x); });
                    };
                    return [4 /*yield*/, (0, youngpg_service_1.listCategories)()];
                case 1:
                    top = (_b.sent()).map(normCat).filter(notNull);
                    hit = (_a = top.find(exact)) !== null && _a !== void 0 ? _a : top.find(loose);
                    if (hit)
                        return [2 /*return*/, { param: "category_id", id: hit.id }];
                    scan = top.slice(0, 30);
                    i = 0;
                    _b.label = 2;
                case 2:
                    if (!(i < scan.length)) return [3 /*break*/, 5];
                    return [4 /*yield*/, Promise.all(scan.slice(i, i + 5).map(function (c) { return __awaiter(_this, void 0, void 0, function () {
                            var subs, _a;
                            var _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, (0, youngpg_service_1.listSubcategories)(c.id)];
                                    case 1:
                                        subs = (_d.sent()).map(normCat).filter(notNull);
                                        return [2 /*return*/, (_c = (_b = subs.find(exact)) !== null && _b !== void 0 ? _b : subs.find(loose)) !== null && _c !== void 0 ? _c : null];
                                    case 2:
                                        _a = _d.sent();
                                        return [2 /*return*/, null]; // skip a category whose subcategories fail to load
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 3:
                    results = _b.sent();
                    s = results.find(function (r) { return r !== null; });
                    if (s)
                        return [2 /*return*/, { param: "subcategory_id", id: s.id }];
                    _b.label = 4;
                case 4:
                    i += 5;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, null];
            }
        });
    }); });
}
/** Exact match on normalized title, else a unique prefix match. */
function findProduct(all, wanted) {
    var _a;
    var w = norm(wanted);
    var exact = all.filter(function (p) { return norm(titleOf(p)) === w; });
    if (exact.length > 0)
        return (_a = exact.find(function (p) { return p.available_stock > 0; })) !== null && _a !== void 0 ? _a : exact[0];
    var loose = all.filter(function (p) {
        var t = norm(titleOf(p));
        return t.startsWith(w) || (t.length > 20 && w.startsWith(t));
    });
    if (loose.length === 1)
        return loose[0];
    return loose.length > 1 ? "ambiguous" : undefined;
}
/** For diagnostics only: the catalog title most similar to a wanted one. */
function closest(all, wanted) {
    var wt = new Set(norm(wanted).split(" "));
    var best = "";
    var bestScore = 0;
    var _loop_1 = function (p) {
        var tokens = new Set(norm(titleOf(p)).split(" "));
        var inter = 0;
        wt.forEach(function (x) {
            if (tokens.has(x))
                inter++;
        });
        var score = inter / (wt.size + tokens.size - inter);
        if (score > bestScore) {
            bestScore = score;
            best = titleOf(p);
        }
    };
    for (var _i = 0, all_1 = all; _i < all_1.length; _i++) {
        var p = all_1[_i];
        _loop_1(p);
    }
    return bestScore >= 0.4 ? best.slice(0, 90) : "nothing similar";
}
function isExcluded(title, exclude) {
    var t = norm(title);
    return exclude.some(function (ex) {
        var e = norm(ex);
        return t === e || (t.length > 30 && e.length > 30 && (t.startsWith(e) || e.startsWith(t)));
    });
}
function toStoreProduct(p, displayName) {
    return {
        slug: p.slug,
        title: displayName || titleOf(p),
        available_stock: p.available_stock,
        price: (0, youngpg_service_1.sellPriceKobo)(p.price_ngn), // kobo, includes your markup; supplier cost is never exposed
    };
}
function buildStorefront() {
    return __awaiter(this, void 0, Promise, function () {
        var problems, all, categories, _loop_2, _i, STOREFRONT_1, cat, slugs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    problems = [];
                    return [4 /*yield*/, cached("all-listings", 90000, function () { return fetchPaged({}); })];
                case 1:
                    all = _a.sent();
                    categories = [];
                    _loop_2 = function (cat) {
                        var items, _b, _c, wanted, found, ref_1, list, err_1;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    items = new Map();
                                    if (!("items" in cat)) return [3 /*break*/, 1];
                                    for (_b = 0, _c = cat.items; _b < _c.length; _b++) {
                                        wanted = _c[_b];
                                        found = findProduct(all, wanted.title);
                                        if (!found) {
                                            problems.push("".concat(cat.name, ": no match for \"").concat(wanted.title.slice(0, 70), "\" (closest: \"").concat(closest(all, wanted.title), "\")"));
                                        }
                                        else if (found === "ambiguous") {
                                            problems.push("".concat(cat.name, ": several matches for \"").concat(wanted.title.slice(0, 70), "\""));
                                        }
                                        else {
                                            items.set(found.slug, toStoreProduct(found, wanted.displayName));
                                        }
                                    }
                                    return [3 /*break*/, 7];
                                case 1:
                                    _d.trys.push([1, 6, , 7]);
                                    return [4 /*yield*/, withTimeout(resolveSupplierCategory(cat.supplierCategory), 12000, "Category lookup")];
                                case 2:
                                    ref_1 = _d.sent();
                                    if (!!ref_1) return [3 /*break*/, 3];
                                    problems.push("".concat(cat.name, ": YoungPG category \"").concat(cat.supplierCategory, "\" not found"));
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, cached("cat:".concat(ref_1.param, ":").concat(ref_1.id), 90000, function () {
                                        var _a;
                                        return fetchPaged((_a = {}, _a[ref_1.param] = ref_1.id, _a));
                                    })];
                                case 4:
                                    list = _d.sent();
                                    list
                                        .filter(function (p) { return !isExcluded(titleOf(p), cat.exclude); })
                                        .forEach(function (p) { return items.set(p.slug, toStoreProduct(p)); });
                                    _d.label = 5;
                                case 5: return [3 /*break*/, 7];
                                case 6:
                                    err_1 = _d.sent();
                                    problems.push("".concat(cat.name, ": failed to load (").concat(err_1.message, ")"));
                                    return [3 /*break*/, 7];
                                case 7:
                                    if (items.size > 0)
                                        categories.push({ key: cat.key, name: cat.name, items: __spreadArray([], items.values(), true) });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, STOREFRONT_1 = storefront_1.STOREFRONT;
                    _a.label = 2;
                case 2:
                    if (!(_i < STOREFRONT_1.length)) return [3 /*break*/, 5];
                    cat = STOREFRONT_1[_i];
                    return [5 /*yield**/, _loop_2(cat)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (problems.length)
                        console.warn("Storefront problems:\n" + problems.join("\n"));
                    slugs = new Set(categories.flatMap(function (c) { return c.items.map(function (i) { return i.slug; }); }));
                    console.warn("Storefront: YoungPG returned ".concat(all.length, " listings"));
                    return [2 /*return*/, { fetched: all.length, categories: categories, slugs: slugs, problems: problems }];
            }
        });
    });
}
// Keep the last good storefront so visitors never wait on a rebuild.
var lastGood = null;
function getStorefront() {
    var _this = this;
    var build = cached("storefront", 90000, function () { return __awaiter(_this, void 0, void 0, function () {
        var b;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, buildStorefront()];
                case 1:
                    b = _a.sent();
                    lastGood = b;
                    return [2 /*return*/, b];
            }
        });
    }); });
    return lastGood ? Promise.resolve(lastGood) : build;
}
// Build it once shortly after the server starts, so the first visitor doesn't wait.
setTimeout(function () {
    getStorefront().catch(function (err) { return console.error("Storefront warm-up failed:", err); });
}, 3000);
// ---- Browse (public) ----
function getCatalog(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var built, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getStorefront()];
                case 1:
                    built = _a.sent();
                    res.json({ categories: built.categories });
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    browseError(res, err_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getCatalog = getCatalog;
/** Admin only: shows which of your configured accounts could not be matched. */
function storefrontCheck(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var me, built, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({ isAdmin: schema_1.users.isAdmin })
                        .from(schema_1.users)
                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId))];
                case 1:
                    me = (_a.sent())[0];
                    if (!(me === null || me === void 0 ? void 0 : me.isAdmin))
                        return [2 /*return*/, res.status(403).json({ error: "Forbidden" })];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, getStorefront()];
                case 3:
                    built = _a.sent();
                    res.json({
                        fetched: built.fetched,
                        problems: built.problems,
                        categories: built.categories.map(function (c) { return ({ name: c.name, count: c.items.length }); }),
                    });
                    return [3 /*break*/, 5];
                case 4:
                    err_3 = _a.sent();
                    browseError(res, err_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.storefrontCheck = storefrontCheck;
// ---- Purchase ----
var purchaseSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1).max(255),
    quantity: zod_1.z.number().int().min(1).max(50),
});
function purchaseAccounts(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, _a, slug, quantity, userId, store, err_4, listing, err_5, unitPrice, total, estimatedCost, created, order, txn, result, err_6, uncertain, err_7;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    parsed = purchaseSchema.safeParse(req.body);
                    if (!parsed.success) {
                        return [2 /*return*/, res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() })];
                    }
                    _a = parsed.data, slug = _a.slug, quantity = _a.quantity;
                    userId = req.userId;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getStorefront()];
                case 2:
                    store = _b.sent();
                    if (!store.slugs.has(slug))
                        return [2 /*return*/, res.status(404).json({ error: "Product not found" })];
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _b.sent();
                    return [2 /*return*/, browseError(res, err_4)];
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, (0, youngpg_service_1.getListing)(slug)];
                case 5:
                    listing = _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    err_5 = _b.sent();
                    return [2 /*return*/, browseError(res, err_5)];
                case 7:
                    if (listing.available_stock < quantity) {
                        return [2 /*return*/, res.status(400).json({ error: "Not enough stock available" })];
                    }
                    unitPrice = (0, youngpg_service_1.sellPriceKobo)(listing.price_ngn);
                    total = unitPrice * quantity;
                    estimatedCost = (0, youngpg_service_1.ngnToKobo)(listing.price_ngn) * quantity;
                    return [4 /*yield*/, db_1.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var updated, order, txn;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx
                                            .update(schema_1.users)
                                            .set({ balance: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " - ", ""], ["", " - ", ""])), schema_1.users.balance, total) })
                                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, userId), (0, drizzle_orm_1.gte)(schema_1.users.balance, total)))
                                            .returning({ balance: schema_1.users.balance })];
                                    case 1:
                                        updated = (_a.sent())[0];
                                        if (!updated)
                                            return [2 /*return*/, null];
                                        return [4 /*yield*/, tx
                                                .insert(schema_1.supplierOrders)
                                                .values({
                                                buyerId: userId,
                                                supplierSlug: slug,
                                                title: listing.title,
                                                quantity: quantity,
                                                unitPrice: unitPrice,
                                                pricePaid: total,
                                                costKobo: estimatedCost,
                                                status: "processing",
                                            })
                                                .returning()];
                                    case 2:
                                        order = (_a.sent())[0];
                                        return [4 /*yield*/, tx
                                                .insert(schema_1.transactions)
                                                .values({
                                                userId: userId,
                                                type: "purchase",
                                                amount: -total,
                                                status: "pending",
                                                externalId: order.id,
                                            })
                                                .returning()];
                                    case 3:
                                        txn = (_a.sent())[0];
                                        return [2 /*return*/, { order: order, txn: txn, newBalance: updated.balance }];
                                }
                            });
                        }); })];
                case 8:
                    created = _b.sent();
                    if (!created) {
                        return [2 /*return*/, res.status(402).json({ error: "Insufficient balance. Please fund your wallet." })];
                    }
                    order = created.order, txn = created.txn;
                    _b.label = 9;
                case 9:
                    _b.trys.push([9, 11, , 15]);
                    return [4 /*yield*/, (0, youngpg_service_1.purchase)({ slug: slug, quantity: quantity })];
                case 10:
                    result = _b.sent();
                    return [3 /*break*/, 15];
                case 11:
                    err_6 = _b.sent();
                    uncertain = err_6 instanceof youngpg_service_1.YoungPgError ? err_6.uncertain : true;
                    console.error("YoungPG purchase failed:", err_6);
                    if (!uncertain) return [3 /*break*/, 13];
                    // Outcome unknown: keep the charge in place and flag for a manual check.
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.supplierOrders)
                            .set({ status: "needs_review", failureReason: "Supplier result unknown" })
                            .where((0, drizzle_orm_1.eq)(schema_1.supplierOrders.id, order.id))];
                case 12:
                    // Outcome unknown: keep the charge in place and flag for a manual check.
                    _b.sent();
                    return [2 /*return*/, res.status(202).json({
                            status: "processing",
                            order_id: order.id,
                            message: "Your order is being confirmed. Check your orders shortly.",
                        })];
                case 13: 
                // Clean failure: refund the buyer and mark everything failed.
                return [4 /*yield*/, db_1.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx
                                        .update(schema_1.users)
                                        .set({ balance: (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " + ", ""], ["", " + ", ""])), schema_1.users.balance, total) })
                                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, tx.update(schema_1.transactions).set({ status: "failed" }).where((0, drizzle_orm_1.eq)(schema_1.transactions.id, txn.id))];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, tx
                                            .update(schema_1.supplierOrders)
                                            .set({
                                            status: "failed",
                                            failureReason: err_6 instanceof youngpg_service_1.YoungPgError ? "".concat(err_6.status, ": ").concat(err_6.message) : "Unknown error",
                                        })
                                            .where((0, drizzle_orm_1.eq)(schema_1.supplierOrders.id, order.id))];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 14:
                    // Clean failure: refund the buyer and mark everything failed.
                    _b.sent();
                    if (err_6 instanceof youngpg_service_1.YoungPgError && err_6.status === 429) {
                        return [2 /*return*/, res.status(503).json({ error: "We're busy right now. Please try again in a moment." })];
                    }
                    return [2 /*return*/, res.status(502).json({ error: "This product is temporarily unavailable. You were not charged." })];
                case 15:
                    _b.trys.push([15, 17, , 19]);
                    return [4 /*yield*/, db_1.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx
                                            .update(schema_1.supplierOrders)
                                            .set({
                                            status: "completed",
                                            supplierOrderId: String(result.order_id),
                                            encryptedAccounts: (0, crypto_1.encrypt)(JSON.stringify(result.accounts)),
                                            costKobo: (0, youngpg_service_1.ngnToKobo)(result.amount_ngn),
                                        })
                                            .where((0, drizzle_orm_1.eq)(schema_1.supplierOrders.id, order.id))];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, tx.update(schema_1.transactions).set({ status: "completed" }).where((0, drizzle_orm_1.eq)(schema_1.transactions.id, txn.id))];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 16:
                    _b.sent();
                    return [3 /*break*/, 19];
                case 17:
                    err_7 = _b.sent();
                    // The supplier already charged us. The credentials can still be fetched from
                    // YoungPG with GET /orders/{id}, so record the supplier order id and flag it.
                    console.error("Failed to store credentials for order", order.id, "supplier order", result.order_id, err_7);
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.supplierOrders)
                            .set({
                            status: "needs_review",
                            supplierOrderId: String(result.order_id),
                            failureReason: "Purchased but failed to store credentials",
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.supplierOrders.id, order.id))
                            .catch(function () { })];
                case 18:
                    _b.sent();
                    return [2 /*return*/, res.status(202).json({
                            status: "processing",
                            order_id: order.id,
                            message: "Your order is being confirmed. Check your orders shortly.",
                        })];
                case 19:
                    res.status(201).json({
                        status: "completed",
                        order_id: order.id,
                        accounts: result.accounts,
                        amount_paid: total,
                        new_balance: created.newBalance,
                    });
                    return [2 /*return*/];
            }
        });
    });
}
exports.purchaseAccounts = purchaseAccounts;
// ---- Orders (buyer's own) ----
function getMyOrders(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var rows, err_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db_1.db
                            .select({
                            id: schema_1.supplierOrders.id,
                            title: schema_1.supplierOrders.title,
                            quantity: schema_1.supplierOrders.quantity,
                            unit_price: schema_1.supplierOrders.unitPrice,
                            price_paid: schema_1.supplierOrders.pricePaid,
                            status: schema_1.supplierOrders.status,
                            created_at: schema_1.supplierOrders.createdAt,
                        })
                            .from(schema_1.supplierOrders)
                            .where((0, drizzle_orm_1.eq)(schema_1.supplierOrders.buyerId, req.userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.supplierOrders.createdAt))
                            .limit(100)];
                case 1:
                    rows = _a.sent();
                    res.json({ orders: rows });
                    return [3 /*break*/, 3];
                case 2:
                    err_8 = _a.sent();
                    console.error(err_8);
                    res.status(500).json({ error: "Failed to load orders" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getMyOrders = getMyOrders;
function getMyOrder(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var id, order, accounts, err_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = zod_1.z.string().uuid().safeParse(req.params.id);
                    if (!id.success)
                        return [2 /*return*/, res.status(404).json({ error: "Order not found" })];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.supplierOrders)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.supplierOrders.id, id.data), (0, drizzle_orm_1.eq)(schema_1.supplierOrders.buyerId, req.userId)))];
                case 2:
                    order = (_a.sent())[0];
                    if (!order)
                        return [2 /*return*/, res.status(404).json({ error: "Order not found" })];
                    accounts = order.status === "completed" && order.encryptedAccounts
                        ? JSON.parse((0, crypto_1.decrypt)(order.encryptedAccounts))
                        : [];
                    res.json({
                        id: order.id,
                        title: order.title,
                        quantity: order.quantity,
                        unit_price: order.unitPrice,
                        price_paid: order.pricePaid,
                        status: order.status,
                        created_at: order.createdAt,
                        accounts: accounts,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_9 = _a.sent();
                    console.error(err_9);
                    res.status(500).json({ error: "Failed to load order" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getMyOrder = getMyOrder;
var templateObject_1, templateObject_2;
