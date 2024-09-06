import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import MenuItem from "@mui/material/MenuItem";

const SiteMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    {
      label: "Search",
      link: "/",
    },
    {
      label: "Insert",
      link: "/insert",
    },
  ];

  const SiteMenuItem = ({ link, label, color }) => (
    <Link href={link} underline="none">
      <ListItemButton onClick={handleClose}>
        <ListItemText primary={label} primaryTypographyProps={{ color }} />
      </ListItemButton>
    </Link>
  );

  return (
    <>
      <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
        <IconButton size="large" onClick={handleOpen} color="inherit">
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {menuItems.map((item) => (
            <MenuItem key={item.label} onClick={handleClose}>
              <SiteMenuItem
                link={item.link}
                label={item.label}
                color="primary"
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>
      <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
        <Button onClick={handleClose} sx={{ display: "flex" }}>
          {menuItems.map((item) => (
            <SiteMenuItem
              key={item.label}
              link={item.link}
              label={item.label}
              color="white"
            />
          ))}
        </Button>
      </Box>
    </>
  );
};

export default SiteMenu;
