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

import { useAuth } from "../../contexts/AuthContext";
import { fetchVersions, type Versions } from "../../config/versions";

const About = () => {
  const [versions, setVersions] = useState<Versions | null>(null);
  const { user } = useAuth();

  // fetchVersions non rigetta mai: le versioni non disponibili tornano null e
  // vengono rese come "N/A".
  useEffect(() => {
    fetchVersions().then(setVersions);
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1, mb: 4, flexWrap: "wrap" }}>
            {[
              { label: "Frontend", value: versions?.client },
              { label: "Server",   value: versions?.server },
              { label: "Infra",    value: versions?.infra },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography color="text.secondary" variant="body2">{label}</Typography>
                <Chip label={versions ? (value ? `v${value}` : "N/A") : "…"} size="small" color="primary" />
              </Box>
            ))}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Utente */}
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.5 }}>
            Utente
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1, mb: 4 }}>
            {[
              { label: "Email", value: user?.email },
              { label: "Username", value: user?.username ?? "—" },
              { label: "Ruolo", value: user?.role },
              { label: "Livello", value: user?.instructorLevel ?? "—" },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography color="text.secondary" variant="body2" sx={{ minWidth: 72 }}>{label}</Typography>
                <Chip label={value} size="small" variant="outlined" color="primary" />
              </Box>
            ))}
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
