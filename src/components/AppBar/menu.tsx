import { useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from "@mui/material/IconButton";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from '@mui/icons-material/Home';

import { OverridableComponent } from '@mui/material/OverridableComponent';
import { SvgIconTypeMap } from '@mui/material/SvgIcon';

interface MainMenuItemProps {
  link: string;
  IconComponent: OverridableComponent<SvgIconTypeMap> & { muiName: string };
  label: string
}

const MainMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const MainMenuItem = ({ link, IconComponent, label }: MainMenuItemProps) => (
    <MenuItem onClick={() => { handleClose(); navigate(link); }}>
      <IconComponent sx={{ mr: 1 }} />
      {label}
    </MenuItem>
  )

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
        <MainMenuItem link="/" label="Home" IconComponent={HomeIcon} />
        <MainMenuItem link="/insert" label="Inserisci" IconComponent={AddCircleOutlineIcon} />
      </Menu>
    </>
  )
}

export default MainMenu;