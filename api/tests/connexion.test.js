import request from "supertest";
import app from "../src/app.js";

it("POST /auth/login -> code: 200; json: token", async () => {
  const res = await request(app).post("/auth/login?email=mail@g.com&mdp=ok");
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("token");
});

it("POST /auth/login -> code: 401; json: mauvais identifiants", async () => {
  const res = await request(app).post("/auth/login?email=mail@g.com&mdp=wrong");
  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty("erreur");
});
