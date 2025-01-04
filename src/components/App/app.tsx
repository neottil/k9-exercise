import { PropsWithChildren, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { ThemeProvider } from "@mui/material/styles";

import "./index.css";
import theme from "./theme";
import AppBar from "../AppBar";
import Footer from "../Footer";

const ScrollToTop = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  useLayoutEffect(() => {
    document.documentElement.scrollTo(0, 0);
  }, [location.pathname]);
  return children
}

const App = ({ user, signOut }: WithAuthenticatorProps) => (
  <ScrollToTop>
    <ThemeProvider theme={theme}>
      <AppBar user={user} signOut={signOut} />
      <Outlet context={{ user }} />
      <Footer />
    </ThemeProvider>
  </ScrollToTop>
);

export default App;
