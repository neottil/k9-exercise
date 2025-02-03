import { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import MainMenu from "./menu";

const SiteAppBar = ({ signOut }: WithAuthenticatorProps) => {
  return (
    <AppBar position="sticky">
      <Toolbar sx={{ width: "100%" }}>
        <MainMenu />
        <Link href={"/"} underline="none" color="secondary" sx={{ flexGrow: 1, justifyContent: "center", display: "flex" }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: "bold" }}>
            K9 Cross Training Exercise Database
          </Typography>
        </Link>
        <Button onClick={signOut} color="secondary">
          Sign out
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default SiteAppBar;
