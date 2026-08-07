// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { getExercisesCreatedByUser, getChangesProposedByUser } from "../../api/audit";
import { describeError } from "../../api/apiFetch";
import { useNotification } from "../../contexts/NotificationContext";
import type { ExercisesCreatedByUser, ChangesProposedByUser } from "../../interfaces/adminInterfaces";

interface RankingRow {
  user: string;
  count: number;
}

interface RankingCardProps {
  title: string;
  countLabel: string;
  emptyMessage: string;
  rows: RankingRow[] | null;
}

// Due precisazioni necessarie, entrambe invisibili guardando solo la tabella:
// il server tronca alle prime 5 posizioni (5 righe si leggerebbero come "questi
// sono tutti gli utenti che hanno contribuito"), e il conteggio considera solo
// ciò che è stato approvato — proposte in attesa e rifiutate non compaiono.
const RankingCard = ({ title, countLabel, emptyMessage, rows }: RankingCardProps) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Prime 5 posizioni · solo contributi approvati
      </Typography>

      {rows === null ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Seleziona un periodo e premi Carica.
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {emptyMessage}
        </Typography>
      ) : (
        <TableContainer sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Utente</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">{countLabel}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.user}>
                  <TableCell>{row.user}</TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CardContent>
  </Card>
);

const AuditTab = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [created, setCreated] = useState<RankingRow[] | null>(null);
  const [changes, setChanges] = useState<RankingRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  // Un solo periodo per entrambe le classifiche: la domanda dell'admin è
  // "in questo periodo, chi ha contribuito di più" — non ha senso far
  // compilare due volte le stesse date.
  const handleLoad = async () => {
    if (!from) return;
    setLoading(true);
    try {
      const [createdData, changesData] = await Promise.all([
        getExercisesCreatedByUser(from, to || undefined),
        getChangesProposedByUser(from, to || undefined),
      ]);
      setCreated(createdData.map((r: ExercisesCreatedByUser) => ({ user: r.user, count: r.exercisesCreated })));
      setChanges(changesData.map((r: ChangesProposedByUser) => ({ user: r.user, count: r.changesProposed })));
    } catch (err) {
      const { message, details } = describeError(err, "Errore nel caricamento delle classifiche");
      showError(message, details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          label="Da data"
          type="date"
          size="small"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="A data"
          type="date"
          size="small"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }}
        />
        <Button variant="contained" onClick={handleLoad} disabled={!from || loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Carica"}
        </Button>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, maxWidth: 900 }}>
        <RankingCard
          title="Esercizi creati per utente"
          countLabel="Esercizi approvati"
          emptyMessage="Nessun esercizio approvato nel periodo selezionato."
          rows={created}
        />
        <RankingCard
          title="Modifiche proposte per utente"
          countLabel="Modifiche approvate"
          emptyMessage="Nessuna modifica approvata nel periodo selezionato."
          rows={changes}
        />
      </Box>
    </Box>
  );
};

export default AuditTab;
