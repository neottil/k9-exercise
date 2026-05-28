import { createBrowserRouter } from "react-router-dom";

import App from "../App";
import View from "../View";
import Insert from "../Insert";
import Login from "../Login";
import Register from "../Register";
import ProtectedRoute from "./ProtectedRoute";

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
        element: <Insert />,
      },
      {
        path: "update/:id",
        element: <Insert />,
      },
    ],
  },
]);

export default router;
