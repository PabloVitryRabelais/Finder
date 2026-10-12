import request from "supertest";
import app from "../src/app.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const reservationsCreees = [];
let reservationId;

afterAll(async () => {
  if (reservationsCreees.length > 0) {
    await prisma.reservations.deleteMany({
      where: { id: { in: reservationsCreees } },
    });
  }
  await prisma.$disconnect();
});

const dateDebut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const dateFin = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

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
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .get("/reservations/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("/reservations/mine sans token -> 401; json: il faut être connecté", async () => {
    const res = await request(app).get("/reservations/mine");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
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

describe("GET /reservations/received", () => {
  it("/reservations/received token hotelier-> 200; json: reservations", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .get("/reservations/received")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("/reservations/received token voyageur-> 403; json: accès refusé", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .get("/reservations/received")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations/received sans token -> 401; json: il faut être connecté", async () => {
    const res = await request(app).get("/reservations/received");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("GET /reservations/:id", () => {
  it("/reservations/1 -> 200; json: reservation", async () => {
    const res = await request(app).get("/reservations/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("/reservations/999 -> 404; json: reservation introuvable", async () => {
    const res = await request(app).get("/reservations/999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("POST /reservations", () => {
  it("/reservations token voyageur -> 201; json: réservation créée", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const creation = await request(app)
      .post("/reservations")
      .send({ chambreId: 1, dateDebut, dateFin, nbPersonnes: 2 })
      .set("Authorization", `Bearer ${token}`);
    if (creation.body.id) reservationsCreees.push(creation.body.id);
    expect(creation.statusCode).toBe(201);
    expect(creation.body).toHaveProperty("id");
    reservationId = creation.body.id;
  });

  it("/reservations?chambreId=1&dateDebut=2024-06-01&dateFin=2024-06-05&nbpersonnes=2 sans token -> 401; json: il faut être connecté", async () => {
    const res = await request(app).post(
      "/reservations",
    );
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations?chambreId=1&dateDebut=2024-06-01&dateFin=2024-06-05&nbpersonnes=2 token hotelier -> 403; json: accès refusé", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post(
        "/reservations",
      )
      .send({ chambreId: 1, dateDebut, dateFin, nbPersonnes: 2 })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations?chambreId=999&dateDebut=2024-06-01&dateFin=2024-06-05&nbpersonnes=2 token voyageur -> 404; json: chambre introuvable", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post(
        "/reservations",
      )
      .send({ chambreId: 999, dateDebut, dateFin, nbPersonnes: 2 })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations?chambreId=1&dateDebut=2024-06-05&dateFin=2024-06-01&nbpersonnes=2 token voyageur -> 400; json: dates mal renseignées", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post(
        "/reservations",
      )
      .send({
        chambreId: 1,
        dateDebut: dateFin,
        dateFin: dateDebut,
        nbPersonnes: 2,
      })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations?chambreId=1&dateDebut=2024-06-01 token voyageur -> 400; json: données mal renseignées", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .post("/reservations")
      .send({ chambreId: 1, dateDebut })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("PATCH /reservations/:id", () => {
    it("/reservations/id token hotelier -> 200; json: réservation modifiée", async () => {
      const token = (
        await request(app).post(
          "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
        )
      ).body.token;
      const res = await request(app)
        .patch(`/reservations/${reservationId}`)
        .send({ statut: "confirmee" })
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(reservationId);
      expect(res.body.statut).toBe("confirmee");
    });

  it("/reservations/id?statut=confirmee token hotelier -> 404; json: reservation inexistante", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .patch("/reservations/1000")
      .send({ statut: "confirmee" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations/id?statut=confirmee token hotelier -> 403; json: acces refuse", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .patch("/reservations/2")
      .send({ statut: "confirmee" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations/id?statut=confirmee token voyageur -> 403; json: acces refuse", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .patch("/reservations/2")
      .send({ statut: "confirmee" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations/id?statut=refusee token hotelier -> 409; json: transition invalide", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=ravel@amor.example&mdp=Amor-2026!",
      )
    ).body.token;
    const res = await request(app)
      .patch("/reservations/1")
      .send({ statut: "refusee" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations/id?statut=confirmee sans token -> 401; json: il faut etre connecté", async () => {
    const res = await request(app).patch(
      "/reservations/1",
    );
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });
});

describe("DELETE /reservations/:id", () => {
  it("/reservations/999 sans token -> 401; json: il faut être connecté", async () => {
    const res = await request(app).delete("/reservations/999");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations/999 token voyageur -> 404; json: réservation introuvable", async () => {
    const token = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const res = await request(app)
      .delete("/reservations/999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erreur");
  });

  it("/reservations/id token voyageur propriétaire -> 200; json: réservation annulée", async () => {
    const tokenVoyageur = (
      await request(app).post(
        "/auth/login?email=a.morel@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const tokenAutreVoyageur = (
      await request(app).post(
        "/auth/login?email=k.diallo@mail.example&mdp=Voyage-2026!",
      )
    ).body.token;
    const refus = await request(app)
      .delete(`/reservations/${reservationId}`)
      .set("Authorization", `Bearer ${tokenAutreVoyageur}`);
    expect(refus.statusCode).toBe(403);

    const res = await request(app)
      .delete(`/reservations/${reservationId}`)
      .set("Authorization", `Bearer ${tokenVoyageur}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(reservationId);
    expect(res.body.statut).toBe("annulee");
  });
});
