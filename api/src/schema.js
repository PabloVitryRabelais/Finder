import { z } from "zod";

export const validerQuery = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.query);
  if (!r.success) return res.status(400).json({ erreur: r.error.format() });
  req.body = r.data;
  next();
};

export const schemaChambre = z.object({
  numero: z
    .string()
    .refine((numero) => !chambresExistantes.some((c) => c.numero === numero), {
      message: "Ce numéro de chambre existe déjà",
    }),
  categorie: z.enum(["double", "suite", "simple", "familiale"]),
  capacite: z.number().positive(),
  prixNuit: z.number().positive(),
  description: z.string(),
});

export const schemaRegister = z.object({
  email: z.email(),
  mdp: z.string().min(8),
  nom: z.string().min(2),
  prenom: z.string().min(2),
  telephone: z.string().min(10).max(15),
});
