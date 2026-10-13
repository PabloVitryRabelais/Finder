import express from "express";
import { prisma } from "../prisma.js";
import { authRequis, exigeRole, validerQuery } from "../middleware.js";
import { schemaChambre, schemaGetChambre } from "../schema.js";

const router = express.Router();

/**
 * @openapi
 * /chambres:
 *  get:
 *    tags: [chambres]
 *    summary: Données de toutes les chambres selon les paramètres de renseignés
 *    parameters:
 *      - in: query
 *        name: categorie
 *        schema: { type: string }
 *      - in: query
 *        name: date_debut
 *        schema: { type: string, format: date-time }
 *      - in: query
 *        name: date_fin
 *        schema: { type: string, format: date-time }
 *      - in: query
 *        name: prix_max
 *        schema: { type: number }
 *      - in: query
 *        name: hotel
 *        schema: { type: integer }
 *      - in: query
 *        name: capacite
 *        schema: { type: integer }
 *    responses:
 *      200: { description: L'entiereté des chambres selon les paramètres renseignés }
 *      400: { description: Les données sont mal renseignées }
 */
router.get("/", validerQuery(schemaGetChambre), async (req, res) => {
  const { categorie } = req.body;
  const dateDebut = new Date(req.body.date_debut);
  const dateFin = new Date(req.body.date_fin);
  const prixMax = Number(req.body.prixMax);
  const hotelId = Number(req.body.hotel);
  const capacite = Number(req.body.capacite);
  const where = {};

  if (prixMax) where.prixNuit = { lte: prixMax };
  if (categorie) where.categorie = categorie;
  if (hotelId) where.hotelId = hotelId;
  if (capacite) where.capacite = capacite;

  if (dateDebut.getTime() && dateFin.getTime()) {
    if (dateDebut >= dateFin || dateDebut < new Date()) {
      return res.status(400).json({ erreur: "dates invalides" });
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

/**
 * @openapi
 * /chambres/{id}:
 *  get:
 *    tags: [chambres]
 *    summary: Données d'une chambre
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        schema: { type: number }
 *    responses:
 *      200: { description: La chambre demandée }
 *      404: { description: La chambre n'existe pas }
 *      401: { description: Il faut etre connecté }
 */
router.get("/:id", authRequis, async (req, res) => {
  const id = Number(req.params.id);
  const chambre = await prisma.chambres.findUnique({ where: { id } });
  if (!chambre) return res.status(404).json({ erreur: "Chambre introuvable" });
  res.json(chambre);
});

/**
 * @openapi
 * /chambres:
 *  post:
 *    tags: [chambres]
 *    summary: Permet a l'hotelier d'ajouter une chambre
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: query
 *        name: numero
 *        required: true
 *        schema: { type: string }
 *      - in: query
 *        name: categorie
 *        required: true
 *        schema: { type: string }
 *      - in: query
 *        name: capacite
 *        required: true
 *        schema: { type: integer }
 *      - in: query
 *        name: prixNuit
 *        required: true
 *        schema: { type: number }
 *      - in: query
 *        name: description
 *        required: true
 *        schema: { type: string }
 *    responses:
 *      201: { description: Chambre ajoutée }
 *      400: { description: Les données sont mal renseignées }
 *      409: { description: Le numéro de chambre existe déjà }
 *      401: { description: Il faut etre connecté }
 *      403: { description: Le compte connecté n'est pas un hotelier }
 */
router.post(
  "/",
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

/**
 * @openapi
 * /chambres/{id}:
 *  patch:
 *    tags: [chambres]
 *    summary: Permet a l'hotelier de modifier une chambre
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *      - in: query
 *        name: numero
 *        schema: { type: string }
 *      - in: query
 *        name: categorie
 *        schema: { type: string }
 *      - in: query
 *        name: capacite
 *        schema: { type: integer }
 *      - in: query
 *        name: prixNuit
 *        schema: { type: number }
 *      - in: query
 *        name: description
 *        schema: { type: string }
 *    responses:
 *      200: { description: Chambre modifiée }
 *      403: { description: Acces refusé }
 *      400: { description: Les données sont mal renseignées ou la modification a échouée }
 *      401: { description: Il faut etre connecté }
 */
router.patch(
  "/:id",
  authRequis,
  exigeRole("hotelier"),
  validerQuery(schemaChambre.partial()),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ erreur: "Identifiant de chambre invalide" });
    }

    const validation = await prisma.chambres.findFirst({
      where: { id, hotelId: req.user.hotelId },
    });
    if (!validation) {
      return res.status(403).json({ erreur: "Acces refusé" });
    }
    try {
      const chambre = await prisma.chambres.update({
        where: { id },
        data: req.body,
      });
      res.json(chambre);
    } catch (e) {
      res.status(400).json({ erreur: e.message });
    }
  },
);

/**
 * @openapi
 * /chambres/{id}:
 *  delete:
 *    tags: [chambres]
 *    summary: Permet a l'hotelier de supprimer une chambre
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      204: { description: Chambre supprimée }
 *      403: { description: Acces refusé OU chambre introuvable }
 *      401: { description: Il faut etre connecté }
 */
router.delete(
  "/:id",
  authRequis,
  exigeRole("hotelier"),
  async (req, res) => {
    const validation = await prisma.chambres.findFirst({
      where: { id: Number(req.params.id), hotelId: req.user.hotelId },
    });
    if (!validation) {
      return res.status(403).json({ erreur: "Acces refusé" });
    }
    await prisma.chambres.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  },
);

export default router;
