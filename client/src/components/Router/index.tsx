import { createBrowserRouter, useParams } from "react-router-dom";

import App from "../App";
import View from "../View";
import Insert from "../Insert";
import Admin from "../Admin";
import Login from "../Login";
import Register from "../Register";
import ProtectedRoute from "./ProtectedRoute";

/**
 * Wrapper che forza il rimount di Insert al cambio di route.
 * key={id ?? "new"} garantisce che:
 *  - /insert          → key "new"     → form vuoto
 *  - /update/:id      → key = id      → form caricato con i dati dell'esercizio
 *  - cambio tra due id diversi        → rimount, form resettato con i nuovi dati
 */
const InsertRoute = () => {
  const { id } = useParams();
  return <Insert key={id ?? "new"} />;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: <ProtectedRoute><App /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <View />,
      },
      {
        path: "insert",
        element: <InsertRoute />,
      },
      {
        path: "update/:id",
        element: <InsertRoute />,
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute requiredRole="admin">
            <Admin />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
