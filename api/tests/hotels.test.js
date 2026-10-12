import request from "supertest";
import app from "../src/app.js";

describe("GET /hotels", () => {
  it("/hotels -> code: 200; json: hotels", async () => {
    const res = await request(app).get("/hotels");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((hotel) => hotel.id === 1)).toBe(true);
  });
});

describe("GET /hotels/:id", () => {
  it("/hotels/1 -> code: 200; json: hotel demandé", async () => {
    const res = await request(app).get("/hotels/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("/hotels/999 -> code: 404; json: hotel introuvable", async () => {
    const res = await request(app).get("/hotels/999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("GET /hotels/:id/chambres", () => {
  it("/hotels/1/chambres -> code: 200; json: chambres de l'hotel", async () => {
    const res = await request(app).get("/hotels/1/chambres");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((chambre) => chambre.hotelId === 1)).toBe(true);
  });

  it("/hotels/999/chambres -> code: 404; json: hotel introuvable", async () => {
    const res = await request(app).get("/hotels/999/chambres");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erreur");
  });
});