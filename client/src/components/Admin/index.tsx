import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { getPending, approveChange, rejectChange } from "../../api/exercises";
import type { PendingItem } from "../../interfaces/adminInterfaces";
import ExerciseDiff from "./ExerciseDiff";

const Admin = () => {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [selected, setSelected] = useState<PendingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPending();
      setItems(data);
    } catch {
      setError("Impossibile caricare le modifiche in attesa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.exercise.id !== id));
    setSelected((prev) => (prev?.exercise.id === id ? null : prev));
  };

  const handleApprove = async (fieldsToApply: Record<string, unknown>) => {
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await approveChange(selected.exercise.id, fieldsToApply);
      removeItem(selected.exercise.id);
    } catch {
      setActionError("Errore durante l'approvazione");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await rejectChange(selected.exercise.id);
      removeItem(selected.exercise.id);
    } catch {
      setActionError("Errore durante il rifiuto");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px - 48px)", overflow: "hidden" }}>

      {/* ── Pannello sinistro: lista modifiche in attesa ── */}
      <Box
        sx={{
          width: 300,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Modifiche in attesa
          </Typography>
          {!loading && (
            <Typography variant="caption" color="text.secondary">
              {items.length} {items.length === 1 ? "esercizio" : "esercizi"}
            </Typography>
          )}
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 1 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && items.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body2">
              Nessuna modifica in attesa
            </Typography>
          </Box>
        )}

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
              <CardActionArea onClick={() => setSelected(item)}>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Typography variant="body1" noWrap sx={{ fontWeight: "bold" }}>
                    {item.exercise.type}
                  </Typography>
                  {item.exercise.variant && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block", fontStyle: "italic" }}
                    >
                      {item.exercise.variant}
                    </Typography>
                  )}
                  {modifiedBy && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block" }}
                    >
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
      </Box>

      {/* ── Pannello destro: diff ── */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {actionError && (
          <Alert severity="error" onClose={() => setActionError(null)} sx={{ m: 1 }}>
            {actionError}
          </Alert>
        )}

        {!selected ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography color="text.secondary" variant="body1">
              Seleziona un esercizio dalla lista
            </Typography>
            <Typography color="text.disabled" variant="caption">
              per visualizzare le modifiche in attesa
            </Typography>
          </Box>
        ) : (
          <>
            <Divider />
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <ExerciseDiff
                item={selected}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={actionLoading}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Admin;
