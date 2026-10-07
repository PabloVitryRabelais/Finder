import request from "supertest";
import app from "../src/app.js";

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
      await request(app).post("/auth/login?email=mail@g.com&mdp=ok")
    ).body.token;
    const res = await request(app)
      .get("/chambres/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("/chambres/999 token -> code: 404; json: chambre non trouvée", async () => {
    const token = (
      await request(app).post("/auth/login?email=mail@g.com&mdp=ok")
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
      await request(app).post("/auth/login?email=mail@g.com&mdp=ok")
    ).body.token;
    const res = await request(app)
      .post(
        "/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test",
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test token hotelier -> code: 201; json: chambre créée", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post(
        "/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test",
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);
  });

  it("/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test token -> code: 409; json: numero de chambre deja utilisé", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post(
        "/chambres?numero=167&categorie=simple&capacite=2&prixNuit=100&description=test",
      )
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
  it("/chambres/1?prixNuit=150 token hotelier -> code: 200; json: chambre modifiée", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .patch("/chambres/1?prixNuit=150")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    await request(app)
      .patch("/chambres/1?prixNuit=69")
      .set("Authorization", `Bearer ${token}`);
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
    const res = await request(app)
      .patch("/chambres/a?prixNuit=150");
    expect(res.statusCode).toBe(401);
  });
});
