import express from "express";
import { prisma } from "../prisma.js";

const router = express.Router();

/**
 * @openapi
 * /comptes:
 *  get:
 *    tags: [comptes]
 *    summary: Données de tout les comptes
 *    responses:
 *      200: { description: L'entiereté des comptes}
 */
router.get("/", async (req, res) => {
  const comptes = await prisma.comptes.findMany();
  res.json(comptes);
});

/**
 * @openapi
 * /comptes/{id}:
 *  get:
 *    tags: [comptes]
 *    summary: Données d'un compte
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Le compte demandé }
 *      404: { description: Le compte n'existe pas}
 */
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const compte = await prisma.comptes.findFirst({ where: { id } });
  if (!compte) return res.status(404).json({ erreur: "Compte introuvable" });
  res.json(compte);
});

export default router;
