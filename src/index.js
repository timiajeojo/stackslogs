"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_routes_1 = require("./routes/auth.routes");
var auth_middleware_1 = require("./middleware/auth.middleware");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var express_rate_limit_1 = require("express-rate-limit");
require("dotenv/config");
var app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100 }));
app.get("/health", function (req, res) {
    res.json({ status: "ok" });
});
var PORT = process.env.PORT || 3000;
app.use("/api/auth", auth_routes_1.default);
app.get("/api/me", auth_middleware_1.requireAuth, function (req, res) {
    res.json({ userId: req.userId });
});
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
