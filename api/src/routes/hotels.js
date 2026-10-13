import express from "express";
import { prisma } from "../prisma.js";

const router = express.Router();

/**
 * @openapi
 * /hotels:
 *  get:
 *    tags: [hotels]
 *    summary: Données de tous les hotels
 *    responses:
 *      200: { description: renvoie les hotels }
 */
router.get("/", async (req, res) => {
  const hotels = await prisma.hotels.findMany();
  res.json(hotels);
});

/**
 * @openapi
 * /hotels/{id}:
 *  get:
 *    tags: [hotels]
 *    summary: Donnée d'un hotel
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: L'hotel demandé }
 *      404: { description: L'hotel n'existe pas}
 */
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const hotel = await prisma.hotels.findFirst({ where: { id: id } });
  if (!hotel) return res.status(404).json({ erreur: "Hotel introuvable" });
  res.json(hotel);
});

/**
 * @openapi
 * /hotels/{id}/chambres:
 *  get:
 *    tags: [hotels]
 *    summary: Données des chambres d'un hotel
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: "Les chambres de l'hotel demandé (liste vide si l'hotel n'a aucune chambre)" }
 *      404: { description: L'hotel n'existe pas}
 */
router.get("/:id/chambres", async (req, res) => {
  const id = Number(req.params.id);
  const hotel = await prisma.hotels.findFirst({ where: { id: id } });
  if (!hotel) return res.status(404).json({ erreur: "Hotel introuvable" });
  const chambres = await prisma.chambres.findMany({ where: { hotelId: id } });
  res.json(chambres);
});

export default router