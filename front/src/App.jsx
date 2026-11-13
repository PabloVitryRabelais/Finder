import FicheHotel from "./composants/FicheHotel.jsx";
import FicheChambre from "./composants/FicheChambre.jsx";
import ListeChambres from "./composants/ListeChambres.jsx";
import chambres from "../../api/finder-data/chambres.json";
import { useState } from "react";

const hotel = {
  titre: "Dune",
  description: "Un hôtel de luxe au bord de la mer",
};

const chambre = chambres[0];

function App() {
  const [id, setId] = useState(0);
  return (
    <center>
      <h1>Finder</h1>
      <FicheHotel hotel={hotel} />
      <FicheChambre chambre={chambre} hotel={hotel} />
      <ListeChambres chambres={chambres} chambreId={[id, setId]} />
    </center>
  );
}

export default App;
