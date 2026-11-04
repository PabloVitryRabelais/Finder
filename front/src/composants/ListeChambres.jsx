function ListeChambres({ chambres }) {
  if (chambres.length === 0) {
    return <p>Aucune chambre disponible.</p>;
  }
  return (
    <ul>
      {chambres.map((c) => (
        <li>
          {c.numero}, capacite : {c.capacite} pour {c.prixNuit} la nuit
        </li>
      ))}
    </ul>
  );
}

export default ListeChambres;
