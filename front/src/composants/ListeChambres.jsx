import { useState } from "react";
import FicheChambre from "../composants/FicheChambre.jsx";

export default function ListeChambres({ chambres }) {
  const [chambreId, setChambreId] = useState(0);

  if (chambres.length === 0) {
    return <p>Aucune chambre disponible.</p>;
  }

  return (
    <div className="flex gap-4">
      <div className="w-1/2 bg-gray-100 p-4">
        {chambres
          .filter((c) => c.disponible === true)
          .map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setChambreId(c.id)}>
                <strong>{c.numero}</strong>
              </button>
              ; capacite : {c.capacite} pour{" "}
              {c.prix_nuit} euros la nuit
            </li>
          ))}
      </div>
      
      <div className="w-1/2 bg-gray-100 p-4">
        {chambreId != 0 ? <FicheChambre chambre={chambres[chambreId]} hotel={{titre: "Dune"}} />
                        : "Aucune Chambre Sélectionnée"}
      </div>

    </div>
  );
}

