// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import { version as clientVersion } from "../../../package.json";

const About = () => {
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/info")
      .then((r) => r.json())
      .then((data: { version: string }) => setServerVersion(data.version))
      .catch(() => setServerVersion("N/A"));
  }, []);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 6, px: 2 }}>
      <Paper elevation={3} sx={{ maxWidth: 440, width: "100%", overflow: "hidden" }}>

        <Box sx={{ px: 3, py: 3 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: "bold" }}>
            Info
          </Typography>

        {/* Versioni */}
        <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.5 }}>
          Versioni
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography color="text.secondary" variant="body2">Frontend</Typography>
            <Chip label={`v${clientVersion}`} size="small" color="primary" />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography color="text.secondary" variant="body2">Server</Typography>
            <Chip label={serverVersion ? `v${serverVersion}` : "…"} size="small" color="primary" />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Documentazione */}
        <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.5 }}>
          Documentazione
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, mb: 4 }}>
          <MenuBookIcon fontSize="small" color="action" />
          <Link href="https://github.com/neottil/k9-exercise/wiki" target="_blank" rel="noreferrer" variant="body2">
            Manuale utente
          </Link>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Licenza */}
        <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.5 }}>
          Licenza
        </Typography>
        <Box sx={{ mt: 1, mb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Distribuito sotto{" "}
            <Link href="https://www.elastic.co/licensing/elastic-license" target="_blank" rel="noreferrer">
              Elastic License 2.0
            </Link>
            . Uso libero per progetti non commerciali; per uso commerciale contatta{" "}
            <Link href="https://www.lucaneotti.click" target="_blank" rel="noreferrer">
              Luca Neotti
            </Link>
            .
          </Typography>
        </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default About;
