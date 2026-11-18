import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Connexion from "./pages/Connexion.jsx";
import Inscription from "./pages/Inscription.jsx";
import MesReservations from "./pages/MesReservations.jsx";
import PageIntrouvable from "./pages/PageIntrouvable.jsx";
import Recherche from "./pages/Recherche.jsx";
import Reservation from "./pages/Reservation.jsx";
import "./style.css";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/recherche", element: <Recherche /> },
      { path: "/connexion", element: <Connexion /> },
      { path: "/inscription", element: <Inscription /> },
      { path: "/mes-reservations", element: <MesReservations /> },
      { path: "/reserver/:id", element: <Reservation /> },
      { path: "*", element: <PageIntrouvable /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);