import { useState } from "react";
import FicheChambre from "../composants/FicheChambre.jsx";

export default function ListeChambres({ chambres }) {
  const [chambreSelectionnee, setChambreSelectionnee] = useState(null);

  if (chambres.length === 0) {
    return <p className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white px-5 py-6 text-left text-slate-600">Aucune chambre disponible.</p>;
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 text-left md:grid-cols-2">
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <ul className="space-y-2">
          {chambres
            .map((c) => (
              <li key={c.id} onClick={() => setChambreSelectionnee(c)} className="cursor-pointer rounded-lg border border-transparent p-3 text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 focus-within:ring-2 focus-within:ring-teal-600">
                <strong>Chambre {c.numero}</strong>
                <br/>{c.capacite} place(s), pour {c.prixNuit} euros la nuit
              </li>
            ))}
        </ul>
      </div>
      
      <div className="flex min-h-48 min-w-0 items-center rounded-xl border border-slate-200 bg-white p-4 text-left text-slate-700 shadow-sm sm:p-5">
        {chambreSelectionnee ? (
          <FicheChambre chambre={chambreSelectionnee} hotel={{titre: 'Dune'}} />
        ) : (
          <p className="self-start">Aucune Chambre Sélectionnée</p>
        )}
      </div>

    </div>
  );
}
