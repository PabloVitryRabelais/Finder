import { z } from "zod";

export const validerQuery = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.query);
  if (!r.success) return res.status(400).json({ erreur: r.error.format() });
  req.body = r.data;
  next();
};

export const validerBody = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return res.status(400).json({ erreur: r.error.format() });
  req.body = r.data;
  next();
};

export const schemaStatut = z.object({
  statut: z.enum(["confirmee", "refusee"]),
});

export const schemaReservation = z.object({
  chambreId: z.coerce.number().positive(),
  dateDebut: z.string(),
  dateFin: z.string(),
  nbPersonnes: z.coerce.number().positive(),
  demandeSpeciale: z.string().optional(),
});

export const schemaGetChambre = z.object({
  categorie: z.enum(["double", "suite", "simple", "familiale"]).optional(),
  prixMax: z.coerce.number().positive().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  hotel: z.coerce.number().positive().optional(),
  capacite: z.coerce.number().positive().optional(),
});

export const schemaChambre = z.object({
  numero: z.string(),
  categorie: z.enum(["double", "suite", "simple", "familiale"]),
  capacite: z.coerce.number().positive(),
  prixNuit: z.coerce.number().positive(),
  description: z.string(),
});

export const schemaRegister = z.object({
  email: z.email(),
  mdp: z.string().min(8),
  nom: z.string().min(2),
  prenom: z.string().min(2),
  telephone: z.string().min(10).max(15),
});

export const schemaLogin = z.object({
  email: z.string(),
  mdp: z.string(),
});
