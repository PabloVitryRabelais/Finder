import "dotenv/config";
import { readFileSync } from "node:fs";
import express from "express";
import path from "node:path";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  validerQuery,
  schemaChambre,
  schemaRegister,
  schemaReservation,
  schemaGetChambre,
  schemaLogin,
  schemaStatut,
} from "./schema.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

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

/**
 * @openapi
 * /health:
 *  get:
 *    summary: Le serveur est debout
 *    responses:
 *      200: { description: OK }
 */
app.get("/health", (req, res) => res.json({ ok: true }));

// DOCS

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Mon API", version: "1.0.0" },
  },
  apis: ["./server.js"],
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

// HOTELS

/**
 * @openapi
 * /hotels
 *  get:
 *    summary: Données de tous les hotels
 *    responses:
 *      200: { description: renvoie les hotels }
 */
app.get("/hotels", async (req, res) => {
  const hotels = await prisma.hotels.findMany();
  res.json(hotels);
});

/**
 * @openapi
 * /hotels/{id}:
 *  get:
 *    summary: Donnée d'un hotel
 *    parameters:
 *      in: path
 *      name: id
 *      required: true
 *      schema: { type: integer }
 *    responses:
 *      200: { description: L'hotel demandé }
 *      404: { description: L'hotel n'existe pas}
 */
app.get("/hotels/:id", async (req, res) => {
  const id = Number(req.params.id);
  const hotel = await prisma.hotels.findFirst({ where: { id: id } });
  if (!hotel) return res.status(404).json({ erreur: "Hotel introuvable" });
  res.json(hotel);
});

/**
 * @openapi
 * /hotels/{id}/chambres:
 *  get:
 *    summary: Données des chambres d'un hotel
 *    parameters:
 *      - in: path
 *        name: id
 *        required: yes
 *        schema: { type: interger }
 *    responses:
 *      200: { description: Les chambres de l'hotel demandé si [] alors l'hotel n'a aucunes chambres}
 *      404: { description: L'hotel n'existe pas}
 */
app.get("/hotels/:id/chambres", async (req, res) => {
  const id = Number(req.params.id);
  const hotel = await prisma.hotels.findFirst({ where: { id: id } });
  if (!hotel) return res.status(404).json({ erreur: "Hotel introuvable" });
  const chambres = await prisma.chambres.findMany({ where: { hotelId: id } });
  res.json(chambres);
});

// COMPTES

/**
 * @openapi
 * /comptes:
 *  get:
 *    summary: Données de tout les comptes
 *    responses:
 *      200: { description: L'entiereté des comptes}
 */
app.get("/comptes", async (req, res) => {
  const comptes = await prisma.comptes.findMany();
  res.json(comptes);
});

/**
 * @openapi
 * /comptes/{id}:
 *  get:
 *    summary: Données d'un compte
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        shcema { type: integer }
 *    responses:
 *      200: { description: Le compte demandé }
 *      404: { description: Le compte n'existe pas}
 */
app.get("/comptes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const compte = await prisma.comptes.findFirst({ where: { id: id } });
  if (!compte) return res.status(404).json({ erreur: "Compte introuvable" });
  res.json(compte);
});

// RESERVATIONS

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
 *    summary: Données de toutes les reservations
 *    responses:
 *      200: { descriptions: L'entiereté des reservations}
 */
app.get("/reservations", async (req, res) => {
  const reservations = await prisma.reservations.findMany();
  res.json(reservations);
});

/**
 * @openapi
 * /reservations/mine
 *  get:
 *    summary: Données de toutes les reservations du client
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      200: { description: Toutes les reservations du voyageur}
 */
app.get(
  "/reservations/mine",
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
 *    summary: Données des reservations sur l'hotel du client
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      200: { description: Les reservations en attente d'une reponse de l'hotelier}
 */
app.get(
  "/reservations/received",
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
app.get("/reservations/:id", async (req, res) => {
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
 *    summary: Effectuer une reservation
 *    security: [{ bearerAuth: [] }]
 *    requestBody:
 *      application/json:
 *        schema:
 *          type: object
 *          required: [chambreId, dateDebut, dateFin, nbPersonnes]
 *          properties:
 *            chambreId: { type: integer }
 *            dateDebut: { type: string }
 *            dateFin: { type: string }
 *            nbPersonnes: { type: integer }
 *            demandeSpeciale: { type: string }
 *    responses:
 *      201: { description: Reservation effectuée }
 *      404: { description: La chambre n'existe pas }
 *      400: { description: Les dates sont mal renseignées }
 */
app.post(
  "/reservations",
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
        nbPersonnes: req.body.nbPersonnes,
        demandeSpeciale: req.body.demandeSpeciale || "",
        statut: "en attente",
      },
    });
    res.status(201).json(reservation);
  },
);

/**
 * @openapi
 * /reservations/{id}:
 *  patch:
 *    summary: Permet a l'hotelier de repondre a une demande de reservation
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json
 *          schema:
 *            type: object
 *            required: [statut]
 *            properties:
 *              statut: { type: string}
 *    responses:
 *      200: { description: Reponse reussie }
 *      404: { description: La reservation n'existe pas }
 *      403: { description: L'hotelier n'a pas acces a cette reservation }
 *      400: { description: La reponse a echouée }
 */
app.patch(
  "/reservations/:id",
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
 *    summary: Permet au voyageur d'annuler une reservation
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      200: { description: Reservation annulee }
 *      404: { description: La reservation n'existe pas }
 *      403: { description: Le voyageur n'a pas acces a cette reservation }
 *      409: { description: La reservation ne peut pas etre annulee }
 */
app.delete(
  "/reservations/:id",
  authRequis,
  exigeRole("voyageur"),
  async (req, res) => {
    const validation = await prisma.reservations.findFirst({
      where: { id: Number(req.params.id) },
    });
    if (!validation) {
      res.status(404).json({ erreur: "reservation introuvable" });
    }
    if (validation.voyageurId !== req.user.userId) {
      res.status(403).json({ erreur: "acces refuse" });
    }
    if (!transitionValide(validation.statut, "refusee")) {
      res.status(409).json({
        erreur: "passage de " + validation.statut + " a refusee impossible",
      });
    }
    try {
      await prisma.reservations.update({
        where: { id: Number(req.params.id) },
        data: { statut: "refusee" },
      });
    } catch (e) {
      res.status(400).json({ erreur: e.message });
    }
  },
);

//CHAMBRES

/**
 * @openapi
 * /chambres:
 *  get:
 *    summary: Données de toutes les chambres selon les paramètres de renseignés
 *    requestBody:
 *      required: true
 *      content:
 *       application/json:
 *        schema:
 *          type: object
 *          properties:
 *            categorie: { type: string }
 *            date_debut: { type: string }
 *            date_fin: { type: string }
 *            prix_max: { type: number }
 *            hotel: { type: number }
 *            capacite: { type: number }
 *   responses:
 *    200: { description: L'entiereté des chambres selon les paramètres renseignés }
 *    400: { description: Les dates sont mal renseignées }
 */
app.get("/chambres", validerQuery(schemaGetChambre), async (req, res) => {
  const { categorie } = req.body;
  const dateDebut = new Date(req.body.date_debut);
  const dateFin = new Date(req.body.date_fin);
  const prixMax = Number(req.body.prix_max);
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
 */
app.get("/chambres/:id", authRequis, async (req, res) => {
  const id = Number(req.params.id);
  const chambre = await prisma.chambres.findUnique({ where: { id: id } });
  if (!chambre) return res.status(404).json({ erreur: "Chambre introuvable" });
  res.json(chambre);
});

/**
 * @openapi
 * /chambres:
 *  post:
 *    summary: Permet a l'hotelier d'ajouter une chambre
 *    security: [{ bearerAuth: [] }]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [numero, categorie, capacite, prixNuit, description]
 *            properties:
 *              numero: { type: string }
 *              categorie: { type: string }
 *              capacite: { type: number }
 *              prixNuit: { type: number }
 *              description: { type: string }
 *    responses:
 *      201: { description: Chambre ajoutée }
 *      400: { description: Les données sont mal renseignées }
 *      409: { description: Le numéro de chambre existe déjà }
 */
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

/**
 * @openapi
 * /chambres/{id}:
 *  patch:
 *    summary: Permet a l'hotelier de modifier une chambre
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              numero: { type: string }
 *              categorie: { type: string }
 *              capacite: { type: number }
 *              prixNuit: { type: number }
 *              description: { type: string }
 *    responses:
 *      200: { description: Chambre modifiée }
 *      403: { description: Acces refusé }
 *      404: { description: Chambre introuvable }
 */
app.patch(
  "/chambres/:id",
  authRequis,
  exigeRole("hotelier"),
  validerQuery(schemaChambre.partial()),
  async (req, res) => {
    const validation = await prisma.chambres.findFirst({
      where: { id: Number(req.params.id), hotelId: req.user.hotelId },
    });
    if (!validation) {
      return res.status(403).json({ erreur: "Acces refusé" });
    }
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

/**
 * @openapi
 * /chambres/{id}:
 *  delete:
 *    summary: Permet a l'hotelier de supprimer une chambre
 *    security: [{ bearerAuth: [] }]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      204: { description: Chambre supprimée }
 *      403: { description: Acces refusé }
 *      404: { description: Chambre introuvable }
 */
app.delete(
  "/chambres/:id",
  authRequis,
  exigeRole("hotelier"),
  async (req, res) => {
    const validation = await prisma.chambres.findFirst({
      where: { id: Number(req.params.id), hotelId: req.user.hotelId },
    });
    if (!validation) {
      return res.status(403).json({ erreur: "Acces refusé" });
    }
    try {
      await prisma.chambres.delete({ where: { id: Number(req.params.id) } });
      res.status(204).send();
    } catch {
      res.status(404).json({ erreur: "Chambre introuvable" });
    }
  },
);

// CONNEXION

/**
 * @openapi
 * /auth/register:
 *  post:
 *    summary: Permet a un voyageur de créer un compte
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [email, prenom, nom, mdp, telephone]
 *            properties:
 *              email: { type: string }
 *              prenom: { type: string }
 *              nom: { type: string }
 *              mdp: { type: string }
 *              telephone: { type: string }
 *    responses:
 *      201: { description: Compte créé }
 *      400: { description: Données invalides }
 */
app.post("/auth/register", validerQuery(schemaRegister), async (req, res) => {
  try {
    const compte = await prisma.comptes.create({
      data: {
        ...req.body,
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
 *    summary: Permet a un voyageur de se connecter
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [email, mdp]
 *            properties:
 *              email: { type: string }
 *              mdp: { type: string }
 *    responses:
 *      200: { description: Connexion réussie }
 *      401: { description: Identifiants invalides }
 */
app.post("/auth/login", validerQuery(schemaLogin), async (req, res) => {
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
 *    summary: Permet a un voyageur de se déconnecter
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      204: { description: Déconnexion réussie }
 */
app.post("/auth/logout", authRequis, (req, res) => res.status(204).end());

/**
 * @openapi
 * /voyageurs/me:
 *  get:
 *    summary: Données du compte du voyageur connecté
 *    security: [{ bearerAuth: [] }]
 *    responses:
 *      200: { description: Données du compte }
 */
app.get(
  "/voyageurs/me",
  authRequis,
  exigeRole("voyageur"),
  async (req, res) => {
    const compte = await prisma.comptes.findUnique({
      where: { id: req.user.userId },
    });
    res.json(compte);
  },
);

/**
 * @openapi
 * /voyageurs/me:
 *  patch:
 *    summary: Met à jour les informations du compte du voyageur connecté
 *    security: [{ bearerAuth: [] }]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email: { type: string }
 *              prenom: { type: string }
 *              nom: { type: string }
 *              mdp: { type: string }
 *              telephone: { type: string }
 *    responses:
 *      200: { description: Compte mis à jour }
 *      400: { description: Données invalides }
 */
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
