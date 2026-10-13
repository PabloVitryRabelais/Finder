import "dotenv/config";
import express from "express";

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import authRouter from "./routes/auth.js";
import chambresRouter from "./routes/chambres.js";
import comptesRouter from "./routes/comptes.js";
import hotelsRouter from "./routes/hotels.js";
import reservationsRouter from "./routes/reservations.js";
import voyageursRouter from "./routes/voyageurs.js";

const app = express();
app.use(express.json());

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Mon API", version: "1.0.0" },
    tags: [
      {
        name: "santé du serveur",
        description: "Vérification de l'état du serveur",
      },
      { name: "reservations", description: "Opérations sur les reservations" },
      { name: "comptes", description: "Opérations sur les comptes" },
      { name: "hotels", description: "Opérations sur les hotels" },
      { name: "chambres", description: "Opérations sur les chambres" },
      { name: "auth", description: "Authentification" },
      { name: "voyageurs", description: "Opérations sur le compte voyageur" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/**/*.js"],
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
app.use("/hotels", hotelsRouter);
app.use("/reservations", reservationsRouter);
app.use("/chambres", chambresRouter);
app.use("/comptes", comptesRouter);
app.use("/auth", authRouter);
app.use("/voyageurs", voyageursRouter);

/**
 * @openapi
 * /health:
 *  get:
 *    tags: [santé du serveur]
 *    summary: Le serveur est debout
 *    responses:
 *      200: { description: OK }
 */
app.get("/health", (req, res) => res.json({ ok: true }));

export default app;
