import request from "supertest";
import app from "../src/app.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const comptesCrees = [];

afterAll(async () => {
  if (comptesCrees.length > 0) {
    await prisma.comptes.deleteMany({
      where: { email: { in: comptesCrees } },
    });
  }
  await prisma.$disconnect();
});

const nouveauCompte = () => {
  const compte = {
    email: `voyageur-${Date.now()}-${Math.random()}@example.test`,
    mdp: "Test-voyageur-2026",
    nom: "Testeur",
    prenom: "Voyageur",
    telephone: "0612345678",
  };
  comptesCrees.push(compte.email);
  return compte;
};

describe("POST /auth/register", () => {
  it("/auth/register -> code: 201; json: compte créé", async () => {
    const compte = nouveauCompte();
    const res = await request(app).post("/auth/register").send(compte);
    expect(res.statusCode).toBe(201);
    expect(res.body.email).toBe(compte.email);
    expect(res.body).not.toHaveProperty("motDePasse");
  });

  it("/auth/register données invalides -> code: 400; json: erreur", async () => {
    const res = await request(app).post("/auth/register").send({ email: "invalide" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("/auth/login", () => {
  it("POST /auth/login -> code: 200; json: token", async () => {
    const res = await request(app).post(
      "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("POST /auth/login -> code: 401; json: mauvais identifiants", async () => {
    const res = await request(app).post(
      "/auth/login?email=a.morel@mail.example&mdp=wrong",
    );
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });
})

describe("POST /auth/logout", () => {
  it("/auth/logout token valide -> code: 204", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });

  it("/auth/logout sans token -> code: 401; json: erreur", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("GET /voyageurs/me", () => {
  it("/voyageurs/me token voyageur -> code: 200; json: compte", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .get("/voyageurs/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe("a.morel@mail.example");
  });

  it("/voyageurs/me token hotelier -> code: 403; json: erreur", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .get("/voyageurs/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/voyageurs/me sans token -> code: 401; json: erreur", async () => {
    const res = await request(app).get("/voyageurs/me");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("PATCH /voyageurs/me", () => {
  it("/voyageurs/me modification du mot de passe -> code: 200", async () => {
    const compte = nouveauCompte();
    const inscription = await request(app).post("/auth/register").send(compte);
    expect(inscription.statusCode).toBe(201);
    const token = (
      await request(app).post(
        `/auth/login?email=${compte.email}&mdp=${compte.mdp}`,
      )
    ).body.token;
    const nouveauMdp = "Nouveau-voyageur-2026";
    const res = await request(app)
      .patch("/voyageurs/me")
      .send({ mdp: nouveauMdp })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);

    const connexion = await request(app).post(
      `/auth/login?email=${compte.email}&mdp=${nouveauMdp}`,
    );
    expect(connexion.statusCode).toBe(200);
    expect(connexion.body).toHaveProperty("token");
  });

  it("/voyageurs/me token hotelier -> code: 403; json: erreur", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .patch("/voyageurs/me")
      .send({ prenom: "Test" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/voyageurs/me sans token -> code: 401; json: erreur", async () => {
    const res = await request(app).patch("/voyageurs/me").send({ prenom: "Test" });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });
});