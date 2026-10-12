import request from "supertest";
import app from "../src/app.js";

describe("GET /comptes", () => {
  it("/comptes -> code: 200; json: tout les comptes", async () => {
    const res = await request(app).get("/comptes");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /comptes/:id", () => {
  it("/comptes/1 -> code: 200; json: compte demandé", async () => {
    const res = await request(app).get("/comptes/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("/comptes/999 -> code: 404; json: compte non trouvé", async () => {
    const res = await request(app).get("/comptes/999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erreur");
  });
});
