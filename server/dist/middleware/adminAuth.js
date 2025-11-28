"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const token_1 = require("../utils/token");
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const payload = (0, token_1.verifyAdminToken)(token);
    if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
    req.admin = payload.sub;
    return next();
};
exports.requireAdmin = requireAdmin;
