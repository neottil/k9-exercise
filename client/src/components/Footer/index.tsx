import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

const Footer = () => (
  <Box sx={{ bottom: 0, m: "0.5em" }} component="footer">
    <Divider />
    <Typography align="center" sx={{ mt: 0.5 }}>
      Copyright ©2026
    </Typography>
  </Box>
);

export default Footer;
