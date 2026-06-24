// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Collapse, Snackbar } from "@mui/material";

// ─── Tipi ────────────────────────────────────────────────────────────────────

type Severity = "success" | "error" | "info" | "warning";

interface NotificationState {
  open: boolean;
  content: ReactNode;
  severity: Severity;
}

interface NotificationContextValue {
  /** Mostra un messaggio di successo (sfondo verde). */
  showSuccess: (message: string) => void;
  /**
   * Mostra un messaggio di errore (sfondo rosso). Se `details` è valorizzato,
   * sotto al messaggio compare un toggle "Dettagli" con le info tecniche.
   */
  showError: (message: string, details?: string) => void;
  /** Mostra una lista di errori con contenuto collassabile se più di uno. */
  showErrors: (errors: string[]) => void;
  /** Mostra un messaggio informativo (sfondo blu). */
  showInfo: (message: string) => void;
  /** Mostra un avviso (sfondo arancione). */
  showWarning: (message: string) => void;
}

// ─── Componente interno: lista errori collassabile ────────────────────────────

const ErrorList = ({ errors }: { errors: string[] }) => {
  const [expanded, setExpanded] = useState(false);

  if (errors.length === 1) return <>{errors[0]}</>;

  return (
    <Box>
      {/* Primo errore sempre visibile */}
      <Box component="span">{errors[0]}</Box>

      {/* Lista degli errori aggiuntivi — collassabile */}
      <Collapse in={expanded}>
        <Box
          component="ul"
          sx={{ m: 0, mt: 0.5, pl: 2, "& li": { mt: 0.25 } }}
        >
          {errors.slice(1).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </Box>
      </Collapse>

      {/* Toggle */}
      <Box
        component="button"
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: "block",
          mt: 0.75,
          p: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          fontSize: "0.82em",
          textDecoration: "underline",
          opacity: 0.8,
          "&:hover": { opacity: 1 },
        }}
      >
        {expanded ? "Mostra meno" : `Mostra tutti (${errors.length})`}
      </Box>
    </Box>
  );
};

// ─── Componente interno: messaggio errore con dettagli collassabili ───────────

const toggleSx = {
  display: "block",
  mt: 0.75,
  p: 0,
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "inherit",
  fontSize: "0.82em",
  textDecoration: "underline",
  opacity: 0.8,
  "&:hover": { opacity: 1 },
} as const;

const ErrorWithDetails = ({ message, details }: { message: string; details: string }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box>
      <Box component="span">{message}</Box>

      <Collapse in={expanded}>
        <Box
          component="pre"
          sx={{
            m: 0,
            mt: 0.75,
            p: 1,
            fontSize: "0.75em",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            bgcolor: "rgba(0,0,0,0.06)",
            borderRadius: 1,
          }}
        >
          {details}
        </Box>
      </Collapse>

      <Box component="button" onClick={() => setExpanded((v) => !v)} sx={toggleSx}>
        {expanded ? "Nascondi dettagli" : "Dettagli"}
      </Box>
    </Box>
  );
};

// ─── Context ─────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useNotification = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification deve essere usato dentro NotificationProvider");
  return ctx;
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<NotificationState>({
    open: false,
    content: null,
    severity: "info",
  });

  const show = useCallback((content: ReactNode, severity: Severity) => {
    setState({ open: true, content, severity });
  }, []);

  const showSuccess = useCallback((msg: string) => show(msg, "success"), [show]);
  const showError = useCallback(
    (msg: string, details?: string) =>
      show(details ? <ErrorWithDetails message={msg} details={details} /> : msg, "error"),
    [show]
  );
  const showInfo    = useCallback((msg: string) => show(msg, "info"),    [show]);
  const showWarning = useCallback((msg: string) => show(msg, "warning"), [show]);

  const showErrors = useCallback(
    (errors: string[]) => {
      if (errors.length === 0) return;
      show(<ErrorList errors={errors} />, "error");
    },
    [show]
  );

  const handleClose = (_: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setState((prev) => ({ ...prev, open: false }));
  };

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, showErrors, showInfo, showWarning }}
    >
      {children}

      <Snackbar
        open={state.open}
        autoHideDuration={state.severity === "error" ? null : 4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: { xs: 16, sm: 24 } }}
      >
        <Alert
          onClose={() => setState((prev) => ({ ...prev, open: false }))}
          severity={state.severity}
          variant="standard"
          sx={{
            minWidth: 280,
            maxWidth: 480,
            opacity: 0.93,
            backdropFilter: "blur(6px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {state.content}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
