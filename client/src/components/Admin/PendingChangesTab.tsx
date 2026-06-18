// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DataLoader from "../DataLoader";
import { getPending, approveChange, rejectChange } from "../../api/exercises";
import type { PendingItem } from "../../interfaces/adminInterfaces";
import ExerciseDiff from "./ExerciseDiff";
import { useNotification } from "../../contexts/NotificationContext";

const PendingChangesTab = () => {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [selected, setSelected] = useState<PendingItem | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useNotification();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPending();
      setItems(data);
    } catch {
      setError("Impossibile caricare le modifiche in attesa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.exercise.id !== id));
    setSelected((prev) => (prev?.exercise.id === id ? null : prev));
  };

  const handleSelectItem = (item: PendingItem) => {
    setSelected(item);
    if (isMobile) setListOpen(false);
  };

  const handleApprove = async (fieldsToApply: Record<string, unknown>) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await approveChange(selected.exercise.id, fieldsToApply);
      removeItem(selected.exercise.id);
      showSuccess("Modifica approvata con successo");
    } catch {
      showError("Errore durante l'approvazione della modifica");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await rejectChange(selected.exercise.id);
      removeItem(selected.exercise.id);
      showSuccess("Modifica rifiutata");
    } catch {
      showError("Errore durante il rifiuto della modifica");
    } finally {
      setActionLoading(false);
    }
  };

  const listCards = (
    <DataLoader loading={loading} error={error} onRetry={load} minHeight={120}>
      {items.length === 0 ? (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary" variant="body2">
            Nessuna modifica in attesa
          </Typography>
        </Box>
      ) : (
        <>
          {items.map((item) => {
            const isSelected = selected?.exercise.id === item.exercise.id;
            const modifiedBy = item.change?.userUpdate || item.change?.user;
            const modifiedAt = item.change?.updatedAt
              ? new Date(item.change.updatedAt).toLocaleDateString("it-IT")
              : null;
            return (
              <Card
                key={item.exercise.id}
                variant="outlined"
                sx={{
                  m: 1,
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderLeftWidth: isSelected ? 4 : 1,
                  borderRadius: 1,
                }}
              >
                <CardActionArea onClick={() => handleSelectItem(item)}>
                  <CardContent sx={{ py: 1.5, px: 2 }}>
                    <Typography variant="body1" noWrap sx={{ fontWeight: "bold" }}>
                      {item.exercise.type}
                    </Typography>
                    {item.exercise.variant && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", fontStyle: "italic" }}>
                        {item.exercise.variant}
                      </Typography>
                    )}
                    {modifiedBy && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        Da: {modifiedBy}
                      </Typography>
                    )}
                    {modifiedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Il {modifiedAt}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </>
      )}
    </DataLoader>
  );

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: { xs: "column", md: "row" } }}>

      {/* Mobile: lista collassabile */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          flexShrink: 0,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
          onClick={() => setListOpen((o) => !o)}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Modifiche in attesa</Typography>
            {!loading && listOpen && (
              <Typography variant="caption" color="text.secondary">
                {items.length} {items.length === 1 ? "esercizio" : "esercizi"}
              </Typography>
            )}
          </Box>
          {listOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </Box>
        <Collapse in={listOpen}>
          <Box sx={{ maxHeight: "40vh", overflowY: "auto" }}>{listCards}</Box>
        </Collapse>
      </Box>

      {/* Desktop: pannello fisso a sinistra */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: 300,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Modifiche in attesa</Typography>
          {!loading && (
            <Typography variant="caption" color="text.secondary">
              {items.length} {items.length === 1 ? "esercizio" : "esercizi"}
            </Typography>
          )}
        </Box>
        {listCards}
      </Box>

      {/* Pannello diff */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {!selected ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
            <Typography color="text.secondary" variant="body1">Seleziona un esercizio dalla lista</Typography>
            <Typography color="text.disabled" variant="caption">per visualizzare le modifiche in attesa</Typography>
          </Box>
        ) : (
          <>
            <Divider />
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <ExerciseDiff item={selected} onApprove={handleApprove} onReject={handleReject} loading={actionLoading} />
            </Box>
          </>
        )}
      </Box>

    </Box>
  );
};

export default PendingChangesTab;
