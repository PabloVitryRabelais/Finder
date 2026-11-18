import { useEffect, useState } from "react";
import ListeChambres from "../composants/ListeChambres.jsx";
import FicheHotel from "../composants/FicheHotel.jsx";
import { API } from "../config.js";

export default function RechercheChambres() {
    const [filtres, setFiltres] = useState({
        categorie: "",
        prixMax: "",
        dateDebut: "",
        dateFin: "",
        hotel: "",
        capacite: "",
    });
    const [recherche, setRecherche] = useState({});
    const [hotels, setHotels] = useState([]);
    const [enChargement, setEnChargement] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [chambres, setChambres] = useState([]);
    const [hotelAffichage, setHotelAffichage] = useState(null);

    useEffect(() => {
        let annule = false;
        fetch(`${API}/hotels`)
            .then(r => {
                if (!r.ok) throw new Error(`Erreur serveur (${r.status})`);
                return r.json();
            })
            .then(data => { if (!annule) setHotels(data) })
            .catch(erreur => { if (!annule) setErreur(erreur.message) });
        return () => { annule = true; };
    }, []);

    useEffect(() =>{
        let annule = false;
        setEnChargement(true);
        const query = new URLSearchParams();
        Object.entries(recherche).forEach(([nom, valeur]) => {
            if (valeur !== "") query.set(nom, valeur);
        });
        const suffixe = query.toString();
        fetch(`${API}/chambres${suffixe ? `?${suffixe}` : ""}`, { method: "GET" })
            .then(r => {
                if (!r.ok) throw new Error(`Erreur serveur (${r.status})`);
                return r.json();
            })
            .then(data => { if (!annule) setChambres(data) })
            .catch(erreur => { if (!annule) setErreur(erreur.message) })
            .finally(() => { if (!annule) setEnChargement(false); });
        return () => { annule = true; };
    }, [recherche]);

    const modifierFiltre = (e) => {
        const { name, value } = e.target;
        setFiltres((actuels) => ({ ...actuels, [name]: value }));
    };

    const rechercher = (e) => {
        e.preventDefault();
        if (Boolean(filtres.dateDebut) !== Boolean(filtres.dateFin)) {
            setErreur("Renseignez les deux dates pour filtrer les chambres.");
            return;
        }
        setErreur(null);
        setRecherche({ ...filtres });
        if (filtres.hotel !== "") {
            fetch(`${API}/hotels/${filtres.hotel}`, { method: "GET" })
                .then(r => {
                    if (!r.ok) throw new Error(`Erreur serveur (${r.status})`);
                    return r.json();
                })
                .then(r => setHotelAffichage(r))
                .catch(erreur => setErreur(erreur.message));
        } else {
            setHotelAffichage(null);
        }
    }

    return (
        <>
            <form onSubmit={rechercher} className="mx-auto mb-8 grid w-full max-w-5xl grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                <label htmlFor="categories" className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                    Catégorie souhaitée :
                    <select id="categories" name="categorie" value={filtres.categorie} onChange={modifierFiltre} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20">
                        <option value="">Toutes les catégories</option>
                        <option value="simple">Simple</option>
                        <option value="double">Double</option>
                        <option value="suite">Suite</option>
                        <option value="familiale">Familiale</option>
                    </select>
                </label>

                <label htmlFor="prixMax" className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                    Prix maximum par nuit :
                    <input id="prixMax" name="prixMax" type="number" min="1" step="1" value={filtres.prixMax} onChange={modifierFiltre} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
                </label>

                <label htmlFor="dateDebut" className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                    Date d’arrivée :
                    <input id="dateDebut" name="dateDebut" type="date" value={filtres.dateDebut} onChange={modifierFiltre} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
                </label>

                <label htmlFor="dateFin" className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                    Date de départ :
                    <input id="dateFin" name="dateFin" type="date" min={filtres.dateDebut || undefined} value={filtres.dateFin} onChange={modifierFiltre} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
                </label>

                <label htmlFor="hotel" className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                    Hôtel :
                    <select id="hotel" name="hotel" value={filtres.hotel} onChange={modifierFiltre} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20">
                        <option value="">Tous les hôtels</option>
                        {hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.nom}</option>)}
                    </select>
                </label>

                <label htmlFor="capacite" className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">Capacité de la chambre :
                    <input id="capacite" name="capacite" type="number" min="1" step="1" value={filtres.capacite} onChange={modifierFiltre} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
                </label>

                <button type="submit" className="min-h-11 cursor-pointer rounded-lg bg-teal-800 px-5 py-2 font-semibold text-white transition hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:col-span-2 lg:col-span-3">Rechercher</button>
            </form>
            {hotelAffichage !== null ? <FicheHotel hotel={hotelAffichage}/> : null}
            {enChargement && <p className="mx-auto mb-6 max-w-5xl rounded-lg bg-teal-50 px-4 py-3 text-left font-medium text-teal-900">Recherche en cours...</p>}
            {erreur && <p className="mx-auto mb-6 max-w-5xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left font-medium text-red-800">Erreur : {erreur}</p>}
            {!enChargement && !erreur && <ListeChambres chambres={chambres} />}
        </>
    )      
}