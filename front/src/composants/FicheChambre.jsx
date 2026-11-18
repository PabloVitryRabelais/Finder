function FicheChambre({ chambre, hotel }) {
  return (
    <div className="w-full self-start">
      <strong className="mb-3 text-xl font-semibold text-slate-900">Chambre {chambre.numero}</strong><br/>
      <p className="mb-2 text-sm text-slate-600">disponible: <span className="font-medium text-emerald-700">{chambre.disponible ? "Oui" : "Non"}</span></p>
      <p className="mb-2 text-sm text-slate-600">Hôtel: <span className="font-medium text-slate-900">{hotel.titre}</span></p>
      <p className="text-sm leading-6 text-slate-600">{chambre.description}</p>
    </div>
  );
}

export default FicheChambre;
