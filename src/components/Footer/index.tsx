import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

const Footer = () => (
  <Box
    sx={{
      bottom: 0,
      m: "0.5em",
      position: "fixed",
    }}
    component="footer"
  >
    <Divider />
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ display: "inline" }}>Designed with&nbsp;</Typography>
        <Link
          href="https://vitejs.dev/"
          target="_blank"
          rel="noreferrer"
          underline="none"
          sx={{ display: "inline" }}
        >
          Vitejs
        </Link>
        <Typography sx={{ display: "inline" }}>, powered with&nbsp;</Typography>
        <Tooltip title="Deployed by Amplify and routed by Route53">
          <Link
            href="https://aws.amazon.com/it/"
            target="_blank"
            rel="noreferrer"
            underline="none"
            sx={{ display: "inline" }}
          >
            AWS
          </Link>
        </Tooltip>
        <Typography sx={{ display: "inline" }}>&nbsp;by</Typography>
        <Link
          href="https://www.lucaneotti.click"
          target="_blank"
          rel="noreferrer"
          sx={{ display: "inline" }}
        >
          <Typography sx={{ display: "inline" }}>&nbsp;Luca Neotti</Typography>
        </Link>
      </Box>
      <Typography>Copyright ©2024</Typography>
    </Box>
  </Box>
);

export default Footer;
