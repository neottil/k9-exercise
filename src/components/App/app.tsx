import { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { ThemeProvider } from "@mui/material/styles";
import { Outlet } from "react-router-dom";

import "./index.css";
import theme from "./theme";
import AppBar from "../AppBar";
import Footer from "../Footer";

const App = ({ user, signOut }: WithAuthenticatorProps) => {
  /*
  const createExercise = (user: AuthUser | undefined) => {
    client.models.Exercise.create({
      id: uuidv4(),
      description: window.prompt("Description"),
      type: window.prompt("Type") || "default",
      workingArea,
      user: user?.signInDetails?.loginId,
    });
  };
  */

  return (
    <ThemeProvider theme={theme}>
      <AppBar user={user} signOut={signOut} />
      <Outlet context={{user}}/>
      <Footer />
    </ThemeProvider>
  );
};

export default App;
