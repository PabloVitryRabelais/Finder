function FicheHotel({ hotel }) {
  return (
    <div>
      <h2>{hotel.titre}</h2>
      <p>{hotel.description}</p>
    </div>
  );
}

export default FicheHotel;
