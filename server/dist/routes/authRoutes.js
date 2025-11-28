"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const token_1 = require("../utils/token");
const router = (0, express_1.Router)();
router.post("/login", (req, res) => {
    const password = String(req.body?.password ?? "");
    const adminPassword = process.env.ADMIN_PASSWORD || "adminForUp!";
    if (!adminPassword) {
        return res.status(500).json({ message: "ADMIN_PASSWORD not configured on server" });
    }
    if (password !== adminPassword) {
        return res.status(401).json({ message: "Senha inválida" });
    }
    const { token, exp } = (0, token_1.signAdminToken)("admin");
    return res.json({ token, exp });
});
exports.default = router;
