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
import { getExercisesCreatedByUser } from "../../api/audit";
import { describeError } from "../../api/apiFetch";
import { useNotification } from "../../contexts/NotificationContext";
import type { ExercisesCreatedByUser } from "../../interfaces/adminInterfaces";

const AuditTab = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<ExercisesCreatedByUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  const handleLoad = async () => {
    if (!from) return;
    setLoading(true);
    try {
      const data = await getExercisesCreatedByUser(from, to || undefined);
      setResults(data);
    } catch (err) {
      const { message, details } = describeError(err, "Errore nel caricamento della classifica");
      showError(message, details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
      <Card variant="outlined" sx={{ maxWidth: 480 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
            Esercizi creati per utente
          </Typography>

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

          {results !== null && (
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Utente</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">Esercizi creati</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" color="text.secondary">
                          Nessun esercizio trovato nel periodo selezionato.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((row) => (
                      <TableRow key={row.user}>
                        <TableCell>{row.user}</TableCell>
                        <TableCell align="right">{row.exercisesCreated}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuditTab;
