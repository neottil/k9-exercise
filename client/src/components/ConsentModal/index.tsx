// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { describeError } from "../../api/apiFetch";

const ConsentModal = () => {
  const { acceptTerms } = useAuth();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptTerms();
    } catch (err) {
      const { message, details } = describeError(err, "Errore durante l'accettazione dei termini");
      showError(message, details);
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      slotProps={{ paper: { sx: { maxWidth: 480, width: "100%", mx: 2 } } }}
    >
      <DialogTitle sx={{ fontWeight: "bold" }}>
        Informativa sull'utilizzo dei dati
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Benvenuto/a in K9 Exercise.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cliccando <strong>Prosegui</strong> accetti che i dati e le immagini che
          inserisci nell'applicazione siano di proprietà dell'organizzazione e
          potranno essere utilizzati, modificati o rimossi dagli amministratori.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={handleAccept}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          fullWidth
        >
          {loading ? "Attendere…" : "Prosegui"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsentModal;
