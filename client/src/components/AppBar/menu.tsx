import { useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Divider from '@mui/material/Divider';
import IconButton from "@mui/material/IconButton";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useMediaQuery, useTheme } from '@mui/material';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from "@mui/icons-material/Menu";

import { OverridableComponent } from '@mui/material/OverridableComponent';
import { SvgIconTypeMap } from '@mui/material/SvgIcon';
import { useAuth } from '../../contexts/AuthContext';

interface MainMenuItemProps {
  link: string;
  IconComponent: OverridableComponent<SvgIconTypeMap> & { muiName: string };
  label: string;
  onNavigate: (link: string) => void;
}

// Definito fuori dal componente padre per evitare ricreazioni ad ogni render
const MainMenuItem = ({ link, IconComponent, label, onNavigate }: MainMenuItemProps) => (
  <MenuItem onClick={() => onNavigate(link)}>
    <IconComponent sx={{ mr: 1 }} />
    {label}
  </MenuItem>
);

const MainMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (link: string) => {
    handleClose();
    navigate(link);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <IconButton
        size="large"
        edge="start"
        color="inherit"
        aria-label="menu"
        sx={{ mr: 2 }}
        onClick={handleClick}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MainMenuItem link="/" label="Home" IconComponent={HomeIcon} onNavigate={handleNavigate} />
        <MainMenuItem link="/insert" label="Inserisci" IconComponent={AddCircleOutlineIcon} onNavigate={handleNavigate} />
        {user?.role === "admin" && (
          <MainMenuItem link="/admin" label="Admin" IconComponent={AdminPanelSettingsIcon} onNavigate={handleNavigate} />
        )}
        <MainMenuItem link="/about" label="Info" IconComponent={InfoOutlinedIcon} onNavigate={handleNavigate} />
        {user && isMobile && (
          [
            <Divider key="logout-divider" />,
            <MenuItem key="logout" onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>,
          ]
        )}
      </Menu>
    </>
  );
};

export default MainMenu;
