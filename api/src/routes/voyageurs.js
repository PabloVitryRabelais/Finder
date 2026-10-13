import bcrypt from "bcrypt";
import express from "express";
import { authRequis, exigeRole, validerQuery } from "../middleware.js";
import { prisma } from "../prisma.js";
import { schemaRegister } from "../schema.js";

const router = express.Router();

/**
 * @openapi
 * /voyageurs/me:
 *  get:
 *    tags: [voyageurs]
 *    summary: Données du compte du voyageur connecté
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      200: { description: Données du compte }
 *      401: { description: Il faut etre connecté }
 *      403: { description: Le compte connecté n'est pas un voyageur }
 */
router.get("/me", authRequis, exigeRole("voyageur"), async (req, res) => {
  const compte = await prisma.comptes.findUnique({
    where: { id: req.user.userId },
  });
  res.json(compte);
});

/**
 * @openapi
 * /voyageurs/me:
 *  patch:
 *    tags: [voyageurs]
 *    summary: Met à jour les informations du compte du voyageur connecté
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: query
 *        name: email
 *        schema: { type: string }
 *      - in: query
 *        name: prenom
 *        schema: { type: string }
 *      - in: query
 *        name: nom
 *        schema: { type: string }
 *      - in: query
 *        name: mdp
 *        schema: { type: string }
 *      - in: query
 *        name: telephone
 *        schema: { type: string }
 *    responses:
 *      200: { description: Compte mis à jour }
 *      400: { description: Données invalides }
 *      401: { description: Il faut etre connecté }
 */
router.patch(
  "/me",
  authRequis,
  exigeRole("voyageur"),
  validerQuery(schemaRegister.partial()),
  async (req, res) => {
    if (req.body.role !== undefined || req.body.hotelId !== undefined) {
      return res.status(400).json({
        erreur: "Modification du role ou de l'hotelId interdite",
      });
    }
    const { mdp, ...donneesCompte } = req.body;
    if (mdp !== undefined) {
      donneesCompte.motDePasse = await bcrypt.hash(mdp, 10);
    }
    const compte = await prisma.comptes.update({
      where: { id: req.user.userId },
      data: donneesCompte,
    });
    res.json(compte);
  },
);

export default router;
