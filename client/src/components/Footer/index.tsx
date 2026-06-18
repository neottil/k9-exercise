// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

const Footer = () => (
  <Box sx={{ bottom: 0, m: "0.5em" }} component="footer">
    <Divider />
    <Typography align="center" sx={{ mt: 0.5 }}>
      © 2026{" "}
      <Link href="https://www.lucaneotti.click" target="_blank" rel="noreferrer">
        Luca Neotti
      </Link>
    </Typography>
  </Box>
);

export default Footer;
