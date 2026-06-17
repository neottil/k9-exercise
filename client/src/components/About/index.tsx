import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography color="text.secondary" sx={{ width: 70 }}>
              Frontend
            </Typography>
            <Chip label={`v${clientVersion}`} size="small" color="primary" />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography color="text.secondary" sx={{ width: 70 }}>
              Server
            </Typography>
            <Chip
              label={serverVersion ? `v${serverVersion}` : "…"}
              size="small"
              color="primary"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Attribuzione */}
        <Typography variant="body2" color="text.secondary">
          Designed with{" "}
          <Link href="https://vitejs.dev/" target="_blank" rel="noreferrer">
            Vitejs
          </Link>
          , powered with{" "}
          <Link href="https://kubernetes.io/" target="_blank" rel="noreferrer">
            Kubernetes
          </Link>{" "}
          by{" "}
          <Link href="https://www.lucaneotti.click" target="_blank" rel="noreferrer">
            Luca Neotti
          </Link>
        </Typography>

        </Box>
      </Paper>
    </Box>
  );
};

export default About;
