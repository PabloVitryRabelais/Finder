import "dotenv/config";
import { readFileSync } from "node:fs";
import express from "express";
import path from "node:path";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { schemaChambre, schemaRegister, validerQuery } from "./schema.js";

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

function authRequis(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header || !header.startsWith("Bearer")) {
    return res.status(401).json({ erreur: "Token manquant" });
  }
  const token = header.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erreur: "Token invalide" });
  }
}

function exigeRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ erreur: "Accès interdit" });
    }
    next();
  };
}

app.get("/hotels", async (req, res) => {
  const hotels = await prisma.hotels.findMany();
  res.json(hotels);
});

app.get("/hotels/:id", async (req, res) => {
  const id = Number(req.params.id);
  const hotel = await prisma.hotels.findFirst({ where: { id: id } });
  if (!hotel) return res.status(404).json({ erreur: "Hotel introuvable" });
  res.json(hotel);
});

app.get("/hotels/:id/chambres", async (req, res) => {
  const id = Number(req.params.id);
  const chambres = await prisma.chambres.findMany({ where: { hotelId: id } });
  res.json(chambres);
});

app.get("/comptes", async (req, res) => {
  const comptes = await prisma.comptes.findMany();
  res.json(comptes);
});

app.get("/comptes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const compte = await prisma.comptes.findFirst({ where: { id: id } });
  if (!compte) return res.status(404).json({ erreur: "Compte introuvable" });
  res.json(compte);
});

app.get("/reservations", async (req, res) => {
  const reservations = await prisma.reservations.findMany();
  res.json(reservations);
});

app.get("/reservations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const reservation = await prisma.reservations.findFirst({
    where: { id: id },
  });
  if (!reservation)
    return res.status(404).json({ erreur: "Reservation introuvable" });
  res.json(reservation);
});

app.get("/chambres", async (req, res) => {
  const { categorie } = req.query;
  const dateDebut = new Date(req.query.date_debut);
  const dateFin = new Date(req.query.date_fin);
  const prixMax = Number(req.query.prix_max);
  const hotelId = Number(req.query.hotel);
  const capacite = Number(req.query.capacite);
  const where = {};

  if (req.query.prix_max !== undefined && !Number.isNaN(prixMax))
    where.prixNuit = { lte: prixMax };

  if (categorie) where.categorie = categorie;

  if (req.query.hotel !== undefined && !Number.isNaN(hotelId))
    where.hotelId = hotelId;

  if (req.query.capacite !== undefined && !Number.isNaN(capacite))
    where.capacite = capacite;

  if (!Number.isNaN(dateDebut.getTime()) && !Number.isNaN(dateFin.getTime())) {
    if (dateDebut >= dateFin) {
      return res
        .status(400)
        .json({ erreur: "La date de début doit être < à la date de fin" });
    }
    const reservations = await prisma.reservations.findMany({
      where: {
        dateArrivee: { gte: dateDebut, lte: dateFin },
        dateDepart: { gte: dateDebut, lte: dateFin },
      },
    });
    where.id = { notIn: reservations.map((r) => r.chambreId) };
  }
  res.json(await prisma.chambres.findMany({ where }));
});

app.get("/chambres/:id", authRequis, async (req, res) => {
  const id = Number(req.params.id);
  const chambre = await prisma.chambres.findUnique({ where: { id: id } });
  if (!chambre) return res.status(404).json({ erreur: "Chambre introuvable" });
  res.json(chambre);
});

app.post(
  "/chambres",
  authRequis,
  exigeRole("hotelier"),
  validerQuery(schemaChambre),
  async (req, res) => {
    try {
      const chambreExistante = await prisma.chambres.findFirst({
        where: { numero: req.body.numero, hotelId: req.user.hotelId },
      });
      if (chambreExistante) {
        return res.status(409).json({
          erreur: "Ce numéro de chambre existe déjà",
        });
      }
      const chambre = await prisma.chambres.create({
        data: {
          ...req.body,
          capacite: Number(req.body.capacite),
          prixNuit: Number(req.body.prixNuit),
          hotelId: req.user.hotelId,
          description: req.body.description || " ",
          disponible: true,
        },
      });
      res.status(201).json(chambre);
    } catch (e) {
      res.status(400).json({ erreur: e.message });
    }
  },
);

app.patch(
  "/chambres/:id",
  authRequis,
  validerQuery(schemaChambre.partial()),
  async (req, res) => {
    try {
      const chambre = await prisma.chambres.update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });
      res.json(chambre);
    } catch {
      res.status(404).json({ erreur: "Chambre introuvable" });
    }
  },
);

app.delete("/chambres/:id", authRequis, async (req, res) => {
  try {
    await prisma.chambres.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ erreur: "Chambre introuvable" });
  }
});

app.post("/auth/register", validerQuery(schemaRegister), async (req, res) => {
  const compte = await prisma.comptes.create({
    data: {
      ...req.body,
      motDePasse: await bcrypt.hash(mdp, 10),
      role: "voyageur",
    },
    select: { id: true, email: true, prenom: true },
  });
  res.status(201).json(compte);
});

app.post(
  "/auth/login",
  validerQuery(schemaRegister.partial()),
  async (req, res) => {
    const { email, mdp } = req.body;
    const adherent = await prisma.comptes.findFirst({ where: { email } });
    if (!adherent || !(await bcrypt.compare(mdp, adherent.motDePasse))) {
      return res.status(401).json({ erreur: "identifiants invalides" });
    }
    const token = jwt.sign(
      {
        userId: adherent.id,
        role: adherent.role,
        hotelId: adherent.hotelId || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.json({ token });
  },
);

app.post("/auth/logout", authRequis, (req, res) => res.status(204).end());

app.get("/voyageurs/me", authRequis, async (req, res) => {
  const compte = await prisma.comptes.findUnique({
    where: { id: req.user.userId },
  });
  res.json(compte);
});

app.patch(
  "/voyageurs/me",
  authRequis,
  validerQuery(schemaRegister.partial()),
  async (req, res) => {
    if (req.body.role !== undefined || req.body.hotelId !== undefined) {
      return res.status(400).json({
        erreur: "Modification du role ou de l'hotelId interdite",
      });
    }
    if (req.body.motDePasse !== undefined) {
      req.body.motDePasse = await bcrypt.hash(req.body.motDePasse, 10);
    }
    const compte = await prisma.comptes.update({
      where: { id: req.user.userId },
      data: req.body,
    });
    res.json(compte);
  },
);

app.listen(process.env.PORT ?? 3000);
