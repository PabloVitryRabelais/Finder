import FicheHotel from "./composants/FicheHotel.jsx";
import FicheChambre from "./composants/FicheChambre.jsx";
import ListeChambres from "./composants/ListeChambres.jsx";
import chambres from ".././data/chambres.json";
import { useState } from "react";

const hotel = {
  titre: "Dune",
  description: "Un hôtel de luxe au bord de la mer",
};

function App() {
  return (
    <center>
      <h1>Finder</h1>
      <FicheHotel hotel={hotel} />
      <FicheChambre chambre={chambre} hotel={hotel} />
      <ListeChambres chambres={chambres} />
    </center>
  );
}

export default App;
