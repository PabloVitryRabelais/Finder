function FicheHotel({ hotel }) {
  return (
    <div className="mx-auto mb-8 max-w-5xl rounded-xl bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-700 px-6 py-8 text-left text-white shadow-lg sm:px-10 sm:py-10">
      <h2 className="mb-6 text-3xl font-semibold sm:text-4xl">{hotel.nom}, {hotel.etoiles} étoiles</h2>

      <p className="text-sm font-medium uppercase tracking-wide text-teal-200 sm:text-base">tel: {hotel.telephone}</p>
      <p className="mb-6 text-sm font-medium uppercase tracking-wide text-teal-200 sm:text-base">adresse: {hotel.adresse}</p>
      <p className="max-w-2xl text-base leading-7 text-teal-50 sm:text-lg">{hotel.description}</p>
    </div>
  );
}

export default FicheHotel;
