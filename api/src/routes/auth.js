import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { authRequis, validerQuery } from "../middleware.js";
import { prisma } from "../prisma.js";
import { schemaLogin, schemaRegister } from "../schema.js";

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *  post:
 *    tags: [auth]
 *    summary: Permet a un voyageur de créer un compte
 *    parameters:
 *      - in: query
 *        name: email
 *        required: true
 *        schema: { type: string }
 *      - in: query
 *        name: prenom
 *        required: true
 *        schema: { type: string }
 *      - in: query
 *        name: nom
 *        required: true
 *        schema: { type: string }
 *      - in: query
 *        name: mdp
 *        required: true
 *        schema: { type: string }
 *      - in: query
 *        name: telephone
 *        required: true
 *        schema: { type: string }
 *    responses:
 *      201: { description: Compte créé }
 *      400: { description: Données invalides }
 */
router.post("/register", validerQuery(schemaRegister), async (req, res) => {
  try {
    const { mdp, ...donneesCompte } = req.body;
    const compte = await prisma.comptes.create({
      data: {
        ...donneesCompte,
        motDePasse: await bcrypt.hash(mdp, 10),
        role: "voyageur",
      },
      select: { id: true, email: true, prenom: true },
    });
    res.status(201).json(compte);
  } catch (e) {
    res.status(400).json({ erreur: e.message });
  }
});

/**
 * @openapi
 * /auth/login:
 *  post:
 *    tags: [auth]
 *    summary: Permet a un voyageur de se connecter
 *    parameters:
 *      - in: query
 *        name: email
 *        required: true
 *        schema: { type: string }
 *      - in: query
 *        name: mdp
 *        required: true
 *        schema: { type: string }
 *    responses:
 *      200: { description: Connexion réussie }
 *      401: { description: Identifiants invalides }
 *      400: { description: Données invalides }
 */
router.post("/login", validerQuery(schemaLogin), async (req, res) => {
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
});

/**
 * @openapi
 * /auth/logout:
 *  post:
 *    tags: [auth]
 *    summary: Permet a un voyageur de se déconnecter
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      204: { description: Déconnexion réussie }
 *      401: { description: Il faut etre connecté }
 */
router.post("/logout", authRequis, (req, res) => res.status(204).end());

export default router;
