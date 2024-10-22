import { createBrowserRouter } from "react-router-dom";

import App from "./index"
import View from "../View"
import Insert from "../Insert"

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <View />,
            },
            {
                path: "insert",
                element: <Insert />,
            },
        ],
    },
]);

export default router;