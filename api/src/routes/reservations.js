import express from "express";
import { prisma } from "../prisma.js";

import {
  schemaReservation,
  schemaStatut,
} from "../schema.js";

import {
  authRequis,
  exigeRole,
  validerQuery,
} from "../middleware.js";

const router = express.Router();

const TRANSITIONS_AUTORISEES = {
  en_attente: ["confirmee", "refusee"],
  confirmee: ["annulee"],
  refusee: [],
  annulee: [],
};

function transitionValide(statutActuel, statutVoulu) {
  return (TRANSITIONS_AUTORISEES[statutActuel] || []).includes(statutVoulu);
}

/**
 * @openapi
 * /reservations:
 *  get:
 *    tags: [reservations]
 *    summary: Données de toutes les reservations
 *    responses:
 *      200: { description: L'entiereté des reservations}
 */
router.get("/", async (req, res) => {
  const reservations = await prisma.reservations.findMany();
  res.json(reservations);
});

/**
 * @openapi
 * /reservations/mine:
 *  get:
 *    tags: [reservations]
 *    summary: Données de toutes les reservations du client
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      200: { description: Toutes les reservations du voyageur}
 *      401: { description: Il faut etre connecté }
 *      403: { description: Le compte connecté n'est pas un voyageur }
 */
router.get(
  "/mine",
  authRequis,
  exigeRole("voyageur"),
  async (req, res) => {
    const reservations = await prisma.reservations.findMany({
      where: { voyageurId: req.user.userId },
    });
    res.json(reservations);
  },
);

/**
 * @openapi
 * /reservations/received:
 *  get:
 *    tags: [reservations]
 *    summary: Données des reservations sur l'hotel du client
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      200: { description: Les reservations en attente d'une reponse de l'hotelier}
 *      401: { description: Il faut etre connecté }
 *      403: { description: Le compte connecté n'est pas un hotelier }
 */
router.get(
  "/received",
  authRequis,
  exigeRole("hotelier"),
  async (req, res) => {
    const reservations = await prisma.reservations.findMany({
      where: { chambre: { hotelId: req.user.hotelId } },
    });
    res.json(reservations);
  },
);

/**
 * @openapi
 * /reservations/{id}:
 *  get:
 *    tags: [reservations]
 *    summary: Les données d'une reservation
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: La reservation demandée }
 *      404: { description: La reservation n'existe pas}
 */
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const reservation = await prisma.reservations.findFirst({
    where: { id: id },
  });
  if (!reservation)
    return res.status(404).json({ erreur: "Reservation introuvable" });
  res.json(reservation);
});

/**
 * @openapi
 * /reservations:
 *  post:
 *    tags: [reservations]
 *    summary: Effectuer une reservation
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: query
 *        name: chambreId
 *        required: true
 *        schema: { type: integer }
 *      - in: query
 *        name: dateDebut
 *        required: true
 *        schema: { type: string, format: date-time }
 *      - in: query
 *        name: dateFin
 *        required: true
 *        schema: { type: string, format: date-time }
 *      - in: query
 *        name: nbPersonnes
 *        required: true
 *        schema: { type: integer }
 *      - in: query
 *        name: demandeSpeciale
 *        schema: { type: string }
 *    responses:
 *      201: { description: Reservation effectuée }
 *      404: { description: La chambre n'existe pas }
 *      400: { description: Les données sont mal renseignées }
 *      401: { description: Il faut etre connecté }
 *      403: { description: Le compte connecté n'est pas un voyageur }
 */
router.post(
  "/",
  authRequis,
  exigeRole("voyageur"),
  validerQuery(schemaReservation),
  async (req, res) => {
    const validation = await prisma.chambres.findFirst({
      where: { id: Number(req.body.chambreId) },
    });
    if (!validation) {
      return res.status(404).json({ erreur: "Chambre introuvable" });
    }
    if (
      req.body.dateDebut >= req.body.dateFin ||
      req.body.dateDebut < new Date()
    ) {
      return res.status(400).json({ erreur: "Dates invalides" });
    }
    const reservation = await prisma.reservations.create({
      data: {
        voyageurId: req.user.userId,
        chambreId: req.body.chambreId,
        dateArrivee: new Date(req.body.dateDebut),
        dateDepart: new Date(req.body.dateFin),
        nbPersonnes: Number(req.body.nbPersonnes),
        demandeSpeciale: req.body.demandeSpeciale || "",
        statut: "en_attente",
      },
    });
    res.status(201).json(reservation);
  },
);

/**
 * @openapi
 * /reservations/{id}:
 *  patch:
 *    tags: [reservations]
 *    summary: Permet a l'hotelier de repondre a une demande de reservation
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *      - in: query
 *        name: statut
 *        required: true
 *        schema: { type: string, enum: [confirmee, refusee] }
 *    responses:
 *      200: { description: Reponse reussie }
 *      404: { description: La reservation n'existe pas }
 *      403: { description: Acces refusé }
 *      409: { description: Transition impossible }
 *      401: { description: Il faut etre connecté }
 */
router.patch(
  "/:id",
  authRequis,
  exigeRole("hotelier"),
  validerQuery(schemaStatut),
  async (req, res) => {
    const validation = await prisma.reservations.findFirst({
      where: { id: Number(req.params.id) },
      include: { chambre: true },
    });
    if (!validation) {
      return res.status(404).json({ erreur: "Reservation introuvable" });
    } else if (validation.chambre.hotelId !== req.user.hotelId) {
      return res.status(403).json({ erreur: "Acces refusé" });
    }
    if (!transitionValide(validation.statut, req.body.statut)) {
      return res.status(409).json({
        erreur:
          "passage de " +
          validation.statut +
          " a " +
          req.body.statut +
          " impossible",
      });
    }
    try {
      const reservation = await prisma.reservations.update({
        where: { id: Number(req.params.id) },
        data: { statut: req.body.statut },
      });
      res.json(reservation);
    } catch (e) {
      res.status(400).json({ erreur: e.message });
    }
  },
);

/**
 * @openapi
 * /reservations/{id}:
 *  delete:
 *    tags: [reservations]
 *    summary: Permet au voyageur d'annuler une reservation
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      200: { description: Reservation annulee }
 *      404: { description: La reservation n'existe pas }
 *      403: { description: Acces refusé }
 *      409: { description: La reservation ne peut pas etre annulee }
 *      401: { description: Il faut etre connecté }
 */
router.delete(
  "/:id",
  authRequis,
  exigeRole("voyageur"),
  async (req, res) => {
    const validation = await prisma.reservations.findFirst({
      where: { id: Number(req.params.id) },
    });
    if (!validation) {
      return res.status(404).json({ erreur: "reservation introuvable" });
    }
    if (validation.voyageurId !== req.user.userId) {
      return res.status(403).json({ erreur: "acces refuse" });
    }
    if (!transitionValide(validation.statut, "annulee")) {
      return res.status(409).json({
        erreur: "passage de " + validation.statut + " a annulee impossible",
      });
    }
    try {
      const reservation = await prisma.reservations.update({
        where: { id: Number(req.params.id) },
        data: { statut: "annulee" },
      });
      res.json(reservation);
    } catch (e) {
      res.status(400).json({ erreur: e.message });
    }
  },
);

export default router