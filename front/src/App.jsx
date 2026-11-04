import FicheHotel from "./composants/FicheHotel.jsx";
import FicheChambre from "./composants/FicheChambre.jsx";
import { useState } from "react";

const hotel = {
  titre: "Dune",
  description: "Un hôtel de luxe au bord de la mer",
};

const chambre = {
  numero: 101,
  disponible: true,
};

const films = [
  { id: 3, titre: "Le Voyage de Chihiro", duree: 125 },
  { id: 5, titre: "Wall-E", duree: 98 },
];
const seancesChihiro = [
  { id: 41, horaire: "14:00", salle: 1, filmId: 3 },
  { id: 42, horaire: "18:30", salle: 2, filmId: 3 },
  { id: 43, horaire: "21:00", salle: 1, filmId: 3 },
];
const programme = [
  { id: 41, horaire: "14:00", salle: 1, filmId: 3 },
  { id: 50, horaire: "16:15", salle: 2, filmId: 5 },
  { id: 42, horaire: "18:30", salle: 2, filmId: 3 },
];

function App2() {
  return (
    <center>
      <h1>Finder</h1>
      <FicheHotel hotel={hotel} />
      <FicheChambre chambre={chambre} hotel={hotel} />
    </center>
  );
}

function App() {
  const [filmChoisi, setFilmChoisi] = useState(null);
  return (
    <>
      <center>
        <h1>Programme du cinéma</h1>
        {films.map((f) => (
          <input
            type="button"
            value={f.titre}
            onClick={() => setFilmChoisi(f)}
          />
        ))}
        {filmChoisi && <ListeSeances film={filmChoisi} seances={programme} />}
      </center>
    </>
  );
}

function FicheSeance({ film, seance }) {
  return (
    <li>
      {seance.horaire}, salle {seance.salle} : {film.titre}({film.duree} min)
    </li>
  );
}

function Programme({ films, seances }) {
  return (
    <ul>
      {seances
        .filter((s) => films.find((f) => f.id === s.filmId) !== undefined)
        .map((s) => (
          <FicheSeance film={films.find((f) => f.id === s.filmId)} seance={s} />
        ))}
    </ul>
  );
}

function ListeSeances({ film, seances }) {
  return (
    <ul>
      {seances
        .filter((s) => s.filmId === film.id)
        .map((s) => (
          <FicheSeance film={film} seance={s} />
        ))}
    </ul>
  );
}

export default App;
