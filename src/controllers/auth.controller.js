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
exports.login = exports.register = void 0;
var db_1 = require("../db");
var schema_1 = require("../db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var auth_service_1 = require("../services/auth.service");
var validators_1 = require("../utils/validators");
function register(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, _a, email, password, firstName, lastName, existing, passwordHash, user, token;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    parsed = validators_1.registerSchema.safeParse(req.body);
                    if (!parsed.success) {
                        return [2 /*return*/, res.status(400).json({ error: parsed.error.flatten() })];
                    }
                    _a = parsed.data, email = _a.email, password = _a.password, firstName = _a.firstName, lastName = _a.lastName;
                    return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email))];
                case 1:
                    existing = _b.sent();
                    if (existing.length > 0) {
                        return [2 /*return*/, res.status(409).json({ error: "Email already registered" })];
                    }
                    return [4 /*yield*/, (0, auth_service_1.hashPassword)(password)];
                case 2:
                    passwordHash = _b.sent();
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.users)
                            .values({ email: email, passwordHash: passwordHash, firstName: firstName, lastName: lastName })
                            .returning({ id: schema_1.users.id, email: schema_1.users.email, firstName: schema_1.users.firstName, lastName: schema_1.users.lastName })];
                case 3:
                    user = (_b.sent())[0];
                    token = (0, auth_service_1.generateToken)(user.id);
                    res.status(201).json({ user: user, token: token });
                    return [2 /*return*/];
            }
        });
    });
}
exports.register = register;
function login(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, _a, email, password, user, valid, token;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    parsed = validators_1.loginSchema.safeParse(req.body);
                    if (!parsed.success) {
                        return [2 /*return*/, res.status(400).json({ error: parsed.error.flatten() })];
                    }
                    _a = parsed.data, email = _a.email, password = _a.password;
                    return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email))];
                case 1:
                    user = (_b.sent())[0];
                    if (!user) {
                        return [2 /*return*/, res.status(401).json({ error: "Invalid credentials" })];
                    }
                    return [4 /*yield*/, (0, auth_service_1.comparePassword)(password, user.passwordHash)];
                case 2:
                    valid = _b.sent();
                    if (!valid) {
                        return [2 /*return*/, res.status(401).json({ error: "Invalid credentials" })];
                    }
                    token = (0, auth_service_1.generateToken)(user.id);
                    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }, token: token });
                    return [2 /*return*/];
            }
        });
    });
}
exports.login = login;
