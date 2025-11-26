"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reqLogger = void 0;
const reqLogger = (req, _res, next) => {
    console.log(`[req] ${req.method} ${req.originalUrl}`);
    next();
};
exports.reqLogger = reqLogger;
