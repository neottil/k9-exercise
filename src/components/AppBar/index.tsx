import AppBar from "@mui/material/AppBar";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import MainMenu from "./menu";

const SiteAppBar = () => {
  return (
    <AppBar position="sticky">
      <Toolbar sx={{ width: "100%" }}>
        <MainMenu />
        <Link href={"/"} underline="none" color="secondary" sx={{ flexGrow: 1, justifyContent: "center", display: "flex" }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: "bold" }}>
            K9 Cross Training Exercise Database
          </Typography>
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default SiteAppBar;
