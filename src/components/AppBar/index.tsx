import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";

import MainMenu from "./menu";
import { useAuth } from "../../contexts/AuthContext";

const SiteAppBar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppBar position="sticky">
      {/* Layout a 3 colonne: sinistra / centro / destra — ognuna con flex:1 */}
      <Toolbar sx={{ display: "flex" }}>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
          <MainMenu />
        </Box>

        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Link href="/" underline="none" color="secondary">
            <Typography variant="h5" component="div" sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
              K9 Cross Training Exercise Database
            </Typography>
          </Link>
        </Box>

        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          {user && (
            <Tooltip title={`Logout (${user.email})`}>
              <IconButton color="inherit" onClick={handleLogout} size="small">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default SiteAppBar;
