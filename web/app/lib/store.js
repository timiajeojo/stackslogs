"use client";
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
exports.useUser = exports.useCatalog = exports.naira = exports.API = void 0;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
exports.API = process.env.NEXT_PUBLIC_API_URL || "";
var naira = function (kobo) {
    return (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
exports.naira = naira;
// Remembered between pages so switching to the dashboard doesn't flash a loading screen.
var cachedCats = null;
var cachedUser = null;
/** Loads the storefront (3 attempts, 25s each). Shows the last copy instantly when you come back to a page. */
function useCatalog() {
    var _a = (0, react_1.useState)(cachedCats || []), categories = _a[0], setCats = _a[1];
    var _b = (0, react_1.useState)(!cachedCats), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(false), error = _c[0], setError = _c[1];
    function setCategories(u) {
        setCats(function (prev) {
            var next = typeof u === "function" ? u(prev) : u;
            cachedCats = next;
            return next;
        });
    }
    (0, react_1.useEffect)(function () {
        var cancelled = false;
        function load() {
            return __awaiter(this, void 0, void 0, function () {
                var _loop_1, attempt, state_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _loop_1 = function (attempt) {
                                var ctrl, timer, res, data, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            ctrl = new AbortController();
                                            timer = setTimeout(function () { return ctrl.abort(); }, 25000);
                                            _c.label = 1;
                                        case 1:
                                            _c.trys.push([1, 4, 6, 7]);
                                            return [4 /*yield*/, fetch("".concat(exports.API, "/api/catalog"), { signal: ctrl.signal })];
                                        case 2:
                                            res = _c.sent();
                                            if (!res.ok)
                                                throw new Error("catalog failed");
                                            return [4 /*yield*/, res.json()];
                                        case 3:
                                            data = _c.sent();
                                            if (cancelled)
                                                return [2 /*return*/, { value: void 0 }];
                                            cachedCats = data.categories || [];
                                            setCats(cachedCats);
                                            setError(false);
                                            setLoading(false);
                                            return [2 /*return*/, { value: void 0 }];
                                        case 4:
                                            _b = _c.sent();
                                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 2500); })];
                                        case 5:
                                            _c.sent();
                                            return [3 /*break*/, 7];
                                        case 6:
                                            clearTimeout(timer);
                                            return [7 /*endfinally*/];
                                        case 7: return [2 /*return*/];
                                    }
                                });
                            };
                            attempt = 0;
                            _a.label = 1;
                        case 1:
                            if (!(attempt < 3 && !cancelled)) return [3 /*break*/, 4];
                            return [5 /*yield**/, _loop_1(attempt)];
                        case 2:
                            state_1 = _a.sent();
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                            _a.label = 3;
                        case 3:
                            attempt++;
                            return [3 /*break*/, 1];
                        case 4:
                            if (!cancelled) {
                                if (!cachedCats)
                                    setError(true);
                                setLoading(false);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }
        load();
        return function () {
            cancelled = true;
        };
    }, []);
    return { categories: categories, setCategories: setCategories, loading: loading, error: error };
}
exports.useCatalog = useCatalog;
/** Loads the signed-in user (redirects to /login if not signed in). No blocking screen. */
function useUser() {
    var router = (0, navigation_1.useRouter)();
    var _a = (0, react_1.useState)(cachedUser), user = _a[0], setUserState = _a[1];
    function setUser(u) {
        setUserState(function (prev) {
            var next = typeof u === "function" ? u(prev) : u;
            cachedUser = next;
            return next;
        });
    }
    function logout() {
        localStorage.removeItem("token");
        cachedUser = null;
        cachedCats = null;
        router.push("/login");
    }
    (0, react_1.useEffect)(function () {
        var token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }
        function load() {
            return __awaiter(this, void 0, void 0, function () {
                var res, data, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, fetch("".concat(exports.API, "/api/me"), { headers: { Authorization: "Bearer ".concat(token) } })];
                        case 1:
                            res = _b.sent();
                            if (res.status === 401 || res.status === 403) {
                                localStorage.removeItem("token");
                                cachedUser = null;
                                router.push("/login");
                                return [2 /*return*/];
                            }
                            if (!res.ok)
                                return [2 /*return*/];
                            return [4 /*yield*/, res.json()];
                        case 2:
                            data = _b.sent();
                            cachedUser = data;
                            setUserState(data);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _b.sent();
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        load();
    }, [router]);
    return { user: user, setUser: setUser, logout: logout };
}
exports.useUser = useUser;
