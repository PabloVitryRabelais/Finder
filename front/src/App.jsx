import { Link, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:py-12">
      <header className="mx-auto mb-6 max-w-5xl">
        <h1 className="mb-4 text-center text-3xl font-bold sm:text-4xl">Finder</h1>
        <nav className="flex justify-center gap-4">
          <Link className="text-teal-800 hover:underline" to="/recherche">Recherche</Link>
          <Link className="text-teal-800 hover:underline" to="/connexion">Connexion</Link>
          <Link className="text-teal-800 hover:underline" to="/inscription">Inscription</Link>
          <Link className="text-teal-800 hover:underline" to="/mes-reservations">Mes réservations</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
