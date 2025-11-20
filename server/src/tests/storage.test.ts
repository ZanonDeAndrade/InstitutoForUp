import { strict as assert } from "node:assert";
import test from "node:test";
import { resolvePublicUrl } from "../config/storage";

test("resolvePublicUrl composes local url", () => {
  process.env.PUBLIC_BASE_URL = "http://localhost:4000";
  const url = resolvePublicUrl("courses/example.png");
  assert.equal(url, "http://localhost:4000/uploads/courses/example.png");
});
