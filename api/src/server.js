import "dotenv/config";
import { readFileSync } from "node:fs";
import express from "express";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

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
  res.json(await prisma.chambres.findMany({ where }));
});

app.get("/chambres/:id", async (req, res) => {
  const id = Number(req.params.id);
  const chambre = await prisma.chambres.findUnique({ where: { id: id } });
  if (!chambre) return res.status(404).json({ erreur: "Chambre introuvable" });
  res.json(chambre);
});

app.listen(process.env.PORT ?? 3000);
