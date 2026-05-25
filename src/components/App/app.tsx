import { PropsWithChildren, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
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

const App = () => (
  <ScrollToTop>
    <ThemeProvider theme={theme}>
      <AppBar />
      <Outlet />
      <Footer />
    </ThemeProvider>
  </ScrollToTop>
);

export default App;
