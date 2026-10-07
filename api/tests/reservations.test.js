import request from "supertest";
import app from "../src/app.js";

describe("GET /reservations", () => {
  it("/reservations -> 200; json: reservations", async () => {
    const res = await request(app).get("/reservations");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /reservations/mine", () => {
  it("/reservations/mine token voyageur-> 200; json: reservations", async () => {
    const token = (
      await request(app).post("/auth/login?email=mail@g.com&mdp=ok")
    ).body.token;
    const res = await request(app)
      .get("/reservations/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("/reservations/mine sans token -> 200; json: reservations", async () => {
    const token = (
      await request(app).post("/auth/login?email=mail@g.com&mdp=ok")
    ).body.token;
    const res = await request(app)
      .get("/reservations/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("/reservations/mine token hotelier-> 403; json: accès refusé", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .get("/reservations/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });
});
