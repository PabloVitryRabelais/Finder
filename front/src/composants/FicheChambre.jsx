function FicheChambre({ chambre, hotel }) {
  return (
    <div>
      <h2>{chambre.numero}</h2>
      <p>disponible: {chambre.disponible ? "Oui" : "Non"}</p>
      <p>Hôtel: {hotel.titre}</p>
      <p>{chambre.description}</p>
    </div>
  );
}

export default FicheChambre;
