import FicheHotel from "./composants/FicheHotel.jsx";
import FicheChambre from "./composants/FicheChambre.jsx";

const hotel = {
  titre: "Dune",
  description: "Un hôtel de luxe au bord de la mer",
};

const chambre = {
  numero: 101,
  disponible: true,
};

function App() {
  return (
    <center>
      <h1>Finder</h1>
      <FicheHotel hotel={hotel} />
    </center>
  );
}

export default App;
