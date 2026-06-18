// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import type { ReactNode } from "react";
import { Alert, Box, Button, CircularProgress } from "@mui/material";

interface DataLoaderProps {
  /** Mostra lo spinner di caricamento. */
  loading: boolean;
  /** Messaggio di errore da mostrare; null/undefined = nessun errore. */
  error?: string | null;
  /** Callback opzionale per il pulsante "Riprova". */
  onRetry?: () => void;
  /** Altezza minima del contenitore durante loading/errore. Default: 160px. */
  minHeight?: string | number;
  /** Contenuto da mostrare quando non loading e non errore. */
  children: ReactNode;
}

/**
 * Wrapper centralizzato per il caricamento asincrono di dati.
 *
 * - loading=true  → spinner centrato
 * - error         → Alert rosso con messaggio e pulsante "Riprova" (se onRetry è fornito)
 * - altrimenti    → children
 */
const DataLoader = ({
  loading,
  error,
  onRetry,
  minHeight = 160,
  children,
}: DataLoaderProps) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                Riprova
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};

export default DataLoader;
