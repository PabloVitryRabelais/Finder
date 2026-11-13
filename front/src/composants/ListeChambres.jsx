function ListeChambres({ chambres, chambreId }) {
  if (chambres.length === 0) {
    return <p>Aucune chambre disponible.</p>;
  }
  return (
    <ul>
      {chambres
        .filter((c) => c.disponible === true)
        .map((c) => (
          <li key={c.id}>
            <strong>{c.numero}</strong>; capacite : {c.capacite} pour{" "}
            {c.prix_nuit} euros la nuit
          </li>
        ))}
    </ul>
  );
}

export default ListeChambres;
