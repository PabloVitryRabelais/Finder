import request from "supertest";
import app from "../src/app.js";

it("GET /health -> code: 200; json: OK", async () => {
  const res = await request(app).get("/health");
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ ok: true });
});
