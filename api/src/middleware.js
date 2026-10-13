import jwt from "jsonwebtoken";

export function authRequis(req, res, next) {
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

export function exigeRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ erreur: "Accès interdit" });
    }
    next();
  };
}

export const validerQuery = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.query);
  if (!r.success) return res.status(400).json({ erreur: r.error.format() });
  req.body = r.data;
  next();
};
