// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { describeError } from "../../api/apiFetch";

interface ConsentModalProps {
  open?: boolean;
}

const ConsentModal = ({ open = true }: ConsentModalProps) => {
  const { acceptTerms } = useAuth();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

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
      open={open}
      slotProps={{ paper: { sx: { maxWidth: 480, width: "100%", mx: 2 } } }}
    >
      <DialogTitle sx={{ fontWeight: "bold"}}>
        Benvenuto/a in K9 Exercise
      </DialogTitle>
      <DialogContent>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Informativa sull'utilizzo dei dati
        </Typography>
        <>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Condizioni di utilizzo
          </Typography>
          <FormControlLabel
            sx={{ alignItems: "flex-start", mt: 0.5 }}
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                sx={{ pt: 0 }}
              />
            }
            label={
              <Typography variant="body1" color="text.secondary">
                Dichiaro di aver letto integralmente, compreso e accettato le Condizioni di utilizzo e conferimento dei contenuti, comprese le disposizioni relative ai requisiti di accesso, al Codice etico, al caricamento dei materiali, alla cessione dei diritti sui contenuti e alla sospensione o disattivazione dell’account.
              </Typography>
            }
          />
          <Link href="/Condizioni_uso_K9_Cross_Training.pdf" download sx={{ display: "block", ml: 4, mb: 2.5 }}>
            Scarica le Condizioni di utilizzo (PDF)
          </Link>

          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Informativa privacy
          </Typography>
          <FormControlLabel
            sx={{ alignItems: "flex-start", mt: 0.5 }}
            control={
              <Checkbox
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                sx={{ pt: 0 }}
              />
            }
            label={
              <Typography variant="body1" color="text.secondary">
                Dichiaro di aver letto integralmente e compreso l’Informativa sul trattamento dei dati personali e di aver preso atto delle finalità, delle modalità e delle basi giuridiche del trattamento, dei soggetti ai quali i dati possono essere comunicati e dei diritti che posso esercitare.
              </Typography>
            }
          />
          <Link href="/Informativa_privacy_K9_Cross_Training.pdf" download sx={{ display: "block", ml: 4 }}>
            Scarica l'Informativa privacy (PDF)
          </Link>
        </>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={handleAccept}
          disabled={loading || !termsAccepted || !privacyAccepted}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          fullWidth
        >
          {loading ? "Attendere…" : "Accetta e prosegui"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsentModal;
