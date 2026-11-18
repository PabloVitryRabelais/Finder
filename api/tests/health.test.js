import request from "supertest";
import app from "../src/app.js";

it("GET /health -> code: 200; json: OK", async () => {
  const res = await request(app).get("/health");
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ ok: true });
});

it("GET /health -> autorise le frontend local", async () => {
  const res = await request(app)
    .get("/health")
    .set("Origin", "http://localhost:5173");
  expect(res.headers["access-control-allow-origin"]).toBe(
    "http://localhost:5173",
  );
});
