import { useState } from "react";
import FicheChambre from "../composants/FicheChambre.jsx";

export default function ListeChambres({ chambres }) {
  const [chambreSelectionnee, setChambreSelectionnee] = useState(null);

  if (chambres.length === 0) {
    return <p>Aucune chambre disponible.</p>;
  }

  return (
    <div className="flex gap-4">
      <div className="w-1/2 bg-gray-100 p-4">
        <ul className="list-disc list-inside text-center">
          {chambres
            .filter((c) => c.disponible === true)
            .map((c) => (
              <li key={c.id} onClick={() => setChambreSelectionnee(c)} className="cursor-pointer">
                <strong>{c.numero}</strong>
                ; capacite : {c.capacite} pour{" "}
                {c.prix_nuit} euros la nuit
              </li>
            ))}
        </ul>
      </div>
      
      <div className="w-1/2 bg-gray-100 p-4">
        {chambreSelectionnee ? (
          <FicheChambre chambre={chambreSelectionnee} hotel={{ titre: "Dune" }} />
        ) : (
          "Aucune Chambre Sélectionnée"
        )}
      </div>

    </div>
  );
}
