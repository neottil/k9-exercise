import { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

const SiteAppBar = ({ signOut }: WithAuthenticatorProps) => {
  return (
    <AppBar position="sticky">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
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
