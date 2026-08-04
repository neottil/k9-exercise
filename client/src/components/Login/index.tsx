// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Navigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Link,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { getConfig } from "../../config/runtime";

const LoginToken = () => {
  const { sessionExpired } = useAuth();
  // getConfig() restituisce loginSiteUrl già normalizzato con lo schema: senza
  // "https://" il browser interpreterebbe l'href come path relativo e il link
  // punterebbe a https://<dominio-app>/<url-configurato>.
  const { loginSiteUrl } = getConfig();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ width: 360, p: 2 }}>
        <CardContent>
          <Box component="img" src="/logo.png" alt="K9-EXERCISE wiki enciclopedia degli esercizi" sx={{ width: 250, mx: "auto", display: "block", mb: 2 }} />
          {sessionExpired && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Sessione scaduta. Torna sul sito <Link href={loginSiteUrl} rel="noreferrer">
                {loginSiteUrl}
              </Link> e utilizza il link per accedere nuovamente.
            </Alert>
          )}
          <Alert severity="info">
            L'accesso è gestito tramite <Link href={loginSiteUrl} rel="noreferrer">
                {loginSiteUrl}
              </Link>. Utilizza il link presente sul sito per entrare nell'app.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

const Login = () => {
  const { user, isLoading } = useAuth();

  if (user) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return <LoginToken />;
};

export default Login;
