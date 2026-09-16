import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import hotels from "../finder-data/hotels.json" with { type: "json" };
import chambres from "../finder-data/chambres.json" with { type: "json" };
import comptes from "../finder-data/comptes.json" with { type: "json" };
import reservations from "../finder-data/reservations.json" with { type: "json" };

const prisma = new PrismaClient();

async function main() {
  await prisma.reservations.deleteMany();
  await prisma.chambres.deleteMany();
  await prisma.comptes.deleteMany();
  await prisma.hotels.deleteMany();

  await prisma.hotels.createMany({
    data: hotels.map((h) => ({
      id: h.id,
      nom: h.nom,
      etoiles: h.etoiles,
      adresse: h.adresse,
      codePostal: h.code_postal,
      ville: h.ville,
      telephone: h.telephone,
      email: h.email,
      gerant: h.gerant,
      description: h.description,
    })),
  });

  await prisma.chambres.createMany({
    data: chambres.map((c) => ({
      id: c.id,
      hotelId: c.hotel_id,
      numero: c.numero,
      categorie: c.categorie,
      capacite: c.capacite,
      prixNuit: c.prix_nuit,
      description: c.description,
      disponible: c.disponible,
    })),
  });

  const comptesData = await Promise.all(
    comptes.map(async (c) => ({
      id: c.id,
      role: c.role,
      email: c.email,
      motDePasse: await bcrypt.hash(c.mot_de_passe_clair, 10),
      nom: c.nom,
      prenom: c.prenom,
      hotelId: c.hotel_id,
    })),
  );

  await prisma.comptes.createMany({ data: comptesData });

  await prisma.reservations.createMany({
    data: reservations.map((r) => ({
      id: r.id,
      voyageurId: r.voyageur_id,
      chambreId: r.chambre_id,
      dateArrivee: new Date(r.date_arrivee),
      dateDepart: new Date(r.date_depart),
      nbPersonnes: r.nb_personnes,
      statut: r.statut,
      demandeSpeciale: r.demande_speciale,
    })),
  });
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
