import FicheHotel from "./composants/FicheHotel.jsx";
import FicheChambre from "./composants/FicheChambre.jsx";
import ListeChambres from "./composants/ListeChambres.jsx";
import chambres from "../../api/finder-data/chambres.json";
import { useState } from "react";

const hotel = {
  titre: "Dune",
  description: "Un hôtel de luxe au bord de la mer",
};

const nouvelleChambre = {
  id: 4,
  numero: "99999",
  capacite: 2,
  prix_nuit: 200,
  disponible: true
};

function App() {
  const [chambre, setChambres] = useState(chambres);
  return (
    <center>
      <h1>Finder</h1>
      <FicheHotel hotel={hotel} />
      <ListeChambres chambres={chambre} />
      <button type="button" onClick={() => setChambres([...chambre, nouvelleChambre])} className="cursor-pointer">
        Ajouter une chambre
      </button>
    </center>
  );
}

export default App;
