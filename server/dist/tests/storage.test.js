"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = require("node:assert");
const node_test_1 = __importDefault(require("node:test"));
const storage_1 = require("../config/storage");
(0, node_test_1.default)("resolvePublicUrl composes local url", () => {
    process.env.PUBLIC_BASE_URL = "http://localhost:4000";
    const url = (0, storage_1.resolvePublicUrl)("courses/example.png");
    node_assert_1.strict.equal(url, "http://localhost:4000/uploads/courses/example.png");
});
