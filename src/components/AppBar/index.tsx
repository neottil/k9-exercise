import { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MainMenu from "./menu";

const SiteAppBar = ({ signOut }: WithAuthenticatorProps) => {
  return (
    <AppBar position="sticky">
      <Toolbar sx={{width: "100%"}}>
        <MainMenu />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          K9 Cross Training Exercise Database
        </Typography>
        <Button onClick={signOut} color="secondary">
          Sign out
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default SiteAppBar;
