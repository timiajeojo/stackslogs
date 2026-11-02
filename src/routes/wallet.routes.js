"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var wallet_controller_1 = require("../controllers/wallet.controller");
var auth_middleware_1 = require("../middleware/auth.middleware");
var router = (0, express_1.Router)();
router.get("/", auth_middleware_1.requireAuth, wallet_controller_1.getWallet);
exports.default = router;
