import request from "supertest";
import app from "../src/app.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const chambresCreees = [];
let chambreId;
const numeroChambre = `test-${Date.now()}`;
const cheminChambre = `/chambres?numero=${numeroChambre}&categorie=simple&capacite=2&prixNuit=100&description=test`;

afterAll(async () => {
  if (chambresCreees.length > 0) {
    await prisma.chambres.deleteMany({
      where: { id: { in: chambresCreees } },
    });
  }
  await prisma.$disconnect();
});

describe("GET /chambres", () => {
  it("/chambres -> code: 200; json: chambres", async () => {
    const res = await request(app).get("/chambres");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("/chambres?prixMax=100 -> code: 200; json: chambre", async () => {
    const res = await request(app).get("/chambres?prixMax=100");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((chambre) => chambre.prixNuit <= 100)).toBe(true);
  });

  it("/chambres?hotel=a -> code: 400; json: valeurs invalides", async () => {
    const res = await request(app).get("/chambres?hotel=a");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("GET /chambres/:id", () => {
  it("/chambres/1 token -> code: 200; json: chambre", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .get("/chambres/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("/chambres/999 token -> code: 404; json: chambre non trouvée", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .get("/chambres/999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/chambres/1 sans token -> code: 401; json: non autorisé", async () => {
    const res = await request(app).get("/chambres/1");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("POST /chambres", () => {
  it("/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test sans token -> code: 401; json: non autorisé", async () => {
    const res = await request(app).post(
      "/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test",
    );
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test token voyageur -> code: 403; json: accès refusé", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post(
        "/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test",
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/chambres token hotelier -> code: 201; json: chambre créée", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const creation = await request(app)
      .post(cheminChambre)
      .set("Authorization", `Bearer ${token}`);
    if (creation.body.id) chambresCreees.push(creation.body.id);
    expect(creation.statusCode).toBe(201);
    expect(creation.body).toHaveProperty("id");
    chambreId = creation.body.id;
  });

  it("/chambres numéro déjà créé -> code: 409; json: erreur", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post(cheminChambre)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/chambres?categorie=st token -> code: 400; json: valeurs invalides", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post(
        "/chambres?numero=167&categorie=simple&capacite=2&prixnuit=100&description=test",
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("PATCH /chambres/:id", () => {
    it("/chambres/id token hotelier -> code: 200; json: chambre modifiée", async () => {
      const token = (
        await request(app).post(
          "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
        )
      ).body.token;
      const res = await request(app)
        .patch(`/chambres/${chambreId}?prixNuit=150`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(chambreId);
      expect(res.body.prixNuit).toBe(150);
    });

  it("/chambres/13?prixNuit=150 token voyegeur ou id d'une chambre qui n'appartient pas a l'hotelelier -> code: 403; json: acces refusé", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .patch("/chambres/13?prixNuit=150")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it("/chambres/a?prixNuit=150 token hotelier -> code: 400; json: valeur invalide", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .patch("/chambres/a?prixNuit=150")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  it("/chambres/a?prixNuit=150 sans token -> code: 401; json: il faut etre connecté", async () => {
    const res = await request(app).patch("/chambres/a?prixNuit=150");
    expect(res.statusCode).toBe(401);
  });
});

describe("DELETE /chambres/:id", () => {
  it("/chambres/id token voyageur -> code: 403; json: acces refusé", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .delete("/chambres/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it("/chambres/id token hotelier, chambre d'un autre hotelier -> code: 403; json: acces refusé", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .delete(`/chambres/13`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it("/chambres/id sans token -> code: 401; json: il faut etre connecté", async () => {
    const res = await request(app).delete("/chambres/1");
    expect(res.statusCode).toBe(401);
  });

  it("/chambres/id token hotelier -> code: 204; chambre supprimée", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .delete(`/chambres/${chambreId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(204);

    const lecture = await request(app)
      .get(`/chambres/${chambreId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(lecture.statusCode).toBe(404);
  });
});
