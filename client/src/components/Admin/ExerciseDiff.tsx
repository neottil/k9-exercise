import { Fragment, useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { PendingItem } from "../../interfaces/adminInterfaces";

const BG_CURRENT  = "#ffebee"; // rosso chiaro — valore attuale (campo modificato)
const BG_PROPOSED = "#e8f5e9"; // verde chiaro — valore proposto

// Tutti i field dell'esercizio mostrati in ordine fisso
const DISPLAY_FIELDS = [
  "type", "variant", "description", "difficultyLevel",
  "tools", "setup", "movementPlan", "workingArea", "bodyTarget",
] as const;

const FIELD_LABELS: Record<string, string> = {
  type:         "Tipologia",
  variant:      "Variante",
  description:  "Descrizione",
  setup:        "Setup",
  difficultyLevel: "Difficoltà",
  tools:        "Attrezzi",
  movementPlan: "Piano di movimento",
  workingArea:  "Area target",
  bodyTarget:   "Body target",
};

const WORKING_AREA_LABELS: Record<string, string> = {
  mental:      "Mentale",
  flexibility: "Flessibilità",
  strength:    "Forza",
  balance:     "Equilibrio",
  cardio:      "Cardio",
};

const BODY_TARGET_LABELS: Record<string, string> = {
  ant:      "Anteriore",
  post:     "Posteriore",
  core:     "Core",
  backbone: "Colonna",
  fullBody: "Fullbody",
};

// Per campo semplice → boolean; per workingArea/bodyTarget → Record<subKey, boolean>
type FieldSelection = Record<string, boolean | Record<string, boolean>>;

// ── Rendering valore ────────────────────────────────────────────────────────

const renderValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined || value === "")
    return (
      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
        —
      </Typography>
    );
  if (Array.isArray(value)) {
    if (value.length === 0)
      return (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
          —
        </Typography>
      );
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
        {(value as unknown[]).map((v, i) => (
          <Chip key={i} label={String(v)} size="small" />
        ))}
      </Box>
    );
  }
  return <Typography variant="body2">{String(value)}</Typography>;
};

// ── Cella valore: impila attuale (rosso) + proposto (verde) se modificata ───
// Se non modificata mostra il valore corrente in grigio.

const ValueCell = ({
  current,
  proposed,
  isChanged,
}: {
  current: unknown;
  proposed: unknown;
  isChanged: boolean;
}) => {
  if (!isChanged) {
    return (
      <Box sx={{ p: 1, opacity: 0.45 }}>
        {renderValue(current)}
      </Box>
    );
  }
  return (
    <>
      <Box sx={{ bgcolor: BG_CURRENT, p: 1, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        {renderValue(current)}
      </Box>
      <Box sx={{ bgcolor: BG_PROPOSED, p: 1 }}>
        {renderValue(proposed)}
      </Box>
    </>
  );
};

// ── Sotto-righe workingArea / bodyTarget ─────────────────────────────────────

const AreaSubRows = ({
  fieldKey,
  current,
  proposed,
  subLabels,
  subSelection,
  onToggleSub,
}: {
  fieldKey: string;
  current: Record<string, number> | undefined;
  proposed: Record<string, number> | null; // null = campo non in change.fields
  subLabels: Record<string, string>;
  subSelection: Record<string, boolean>;
  onToggleSub: (sub: string) => void;
}) => (
  <>
    {Object.entries(subLabels).map(([sub, label]) => {
      const cv      = current?.[sub] ?? 0;
      const pv      = proposed?.[sub] ?? 0;
      const changed = proposed !== null && cv !== pv;
      const checked = !!subSelection[sub];
      return (
        <TableRow key={`${fieldKey}-${sub}`}>
          <TableCell sx={{ width: 40, px: 0.5 }}>
            {changed && (
              <Checkbox
                size="small"
                checked={checked}
                onChange={() => onToggleSub(sub)}
              />
            )}
          </TableCell>
          <TableCell
            sx={{
              pl: 4,
              fontSize: 13,
              color: changed ? "text.primary" : "text.disabled",
              verticalAlign: "top",
            }}
          >
            {label}
          </TableCell>
          <TableCell sx={{ p: 0, verticalAlign: "top" }}>
            <ValueCell current={cv} proposed={pv} isChanged={changed} />
          </TableCell>
        </TableRow>
      );
    })}
  </>
);

// ── Prop types ───────────────────────────────────────────────────────────────

interface ExerciseDiffProps {
  item: PendingItem;
  onApprove: (fieldsToApply: Record<string, unknown>) => void;
  onReject: () => void;
  loading: boolean;
}

// ── Componente principale ────────────────────────────────────────────────────

const ExerciseDiff = ({ item, onApprove, onReject, loading }: ExerciseDiffProps) => {
  const { exercise, change } = item;

  // Gli hook devono essere chiamati sempre, prima di qualsiasi return condizionale
  const [fieldSelection, setFieldSelection] = useState<FieldSelection>({});

  useEffect(() => {
    if (!item.change) {
      setFieldSelection({});
      return;
    }
    const exMap = item.exercise as unknown as Record<string, unknown>;
    const chMap = item.change.fields as Record<string, unknown>;

    const initial: FieldSelection = {};
    for (const field of Object.keys(chMap)) {
      if (field === "workingArea" || field === "bodyTarget") {
        const subLabels = field === "workingArea" ? WORKING_AREA_LABELS : BODY_TARGET_LABELS;
        const current  = exMap[field] as Record<string, number> | undefined;
        const proposed = chMap[field] as Record<string, number>;
        const subSel: Record<string, boolean> = {};
        for (const sub of Object.keys(subLabels)) {
          if ((current?.[sub] ?? 0) !== (proposed[sub] ?? 0)) {
            subSel[sub] = true;
          }
        }
        initial[field] = subSel;
      } else {
        initial[field] = true;
      }
    }
    setFieldSelection(initial);
  }, [item]);

  if (!change) return null;

  const changedFields = Object.keys(change.fields) as string[];
  const exerciseAsMap = exercise as unknown as Record<string, unknown>;
  const changedAsMap  = change.fields as Record<string, unknown>;

  const toggleField = (field: string) =>
    setFieldSelection((prev) => ({ ...prev, [field]: !prev[field] }));

  const toggleSubField = (field: string, sub: string) =>
    setFieldSelection((prev) => {
      const subSel = (prev[field] as Record<string, boolean>) ?? {};
      return { ...prev, [field]: { ...subSel, [sub]: !subSel[sub] } };
    });

  const hasAnySelected = Object.entries(fieldSelection).some(([field, sel]) => {
    if (field === "workingArea" || field === "bodyTarget")
      return Object.values(sel as Record<string, boolean>).some((v) => v);
    return !!sel;
  });

  // Costruisce i campi da applicare: solo quelli selezionati.
  // Per workingArea/bodyTarget: merge dei valori correnti + sub-field scelti.
  const computeFieldsToApply = (): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const field of changedFields) {
      const sel = fieldSelection[field];
      if (field === "workingArea" || field === "bodyTarget") {
        const subSel = sel as Record<string, boolean> | undefined;
        if (!subSel || Object.values(subSel).every((v) => !v)) continue;
        const current  = (exerciseAsMap[field] as Record<string, number>) ?? {};
        const proposed = changedAsMap[field] as Record<string, number>;
        const merged: Record<string, number> = { ...current };
        for (const [sub, checked] of Object.entries(subSel)) {
          if (checked) merged[sub] = proposed[sub] ?? 0;
        }
        result[field] = merged;
      } else {
        if (sel) result[field] = changedAsMap[field];
      }
    }
    return result;
  };

  const formattedDate = change.updatedAt
    ? new Date(change.updatedAt).toLocaleString("it-IT", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Area scrollabile: header + legenda + tabella ── */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>

        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {exercise.type}
            {exercise.variant && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                — {exercise.variant}
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Modifica proposta da{" "}
            <strong>{change.userUpdate || change.user || "—"}</strong>
            {" "}il {formattedDate}
          </Typography>
        </Box>

        <Divider />

        {/* Tabella — tutti i field dell'esercizio */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40, px: 0.5 }} />
                <TableCell sx={{ fontWeight: "bold", width: 160 }}>Campo</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Valore</TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {DISPLAY_FIELDS.map((field) => {
              const isChanged = changedFields.includes(field);
              const current   = exerciseAsMap[field];
              const proposed  = changedAsMap[field];

              // Oggetti annidati: workingArea / bodyTarget
              if (field === "workingArea" || field === "bodyTarget") {
                const subLabels = field === "workingArea" ? WORKING_AREA_LABELS : BODY_TARGET_LABELS;
                const subSel    = (fieldSelection[field] as Record<string, boolean>) ?? {};
                return (
                  <Fragment key={field}>
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        sx={{ fontWeight: "bold", bgcolor: "grey.100", py: 0.75, fontSize: 13 }}
                      >
                        {FIELD_LABELS[field]}
                      </TableCell>
                    </TableRow>
                    <AreaSubRows
                      fieldKey={field}
                      current={current as Record<string, number>}
                      proposed={isChanged ? (proposed as Record<string, number>) : null}
                      subLabels={subLabels}
                      subSelection={subSel}
                      onToggleSub={(sub) => toggleSubField(field, sub)}
                    />
                  </Fragment>
                );
              }

              // Campo semplice
              const checked = isChanged && !!fieldSelection[field];
              return (
                <TableRow key={field}>
                  <TableCell sx={{ width: 40, px: 0.5 }}>
                    {isChanged && (
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={() => toggleField(field)}
                      />
                    )}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: isChanged ? 600 : 400,
                      color: isChanged ? "text.primary" : "text.disabled",
                      verticalAlign: "top",
                      fontSize: 13,
                    }}
                  >
                    {FIELD_LABELS[field] ?? field}
                  </TableCell>
                  <TableCell sx={{ p: 0, verticalAlign: "top" }}>
                    <ValueCell current={current} proposed={proposed} isChanged={isChanged} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </TableContainer>

      </Box>{/* fine area scrollabile */}

      {/* ── Pulsanti fissi in fondo ── */}
      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider", display: "flex", gap: 2, justifyContent: "flex-end", flexShrink: 0 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<CloseIcon />}
          onClick={onReject}
          disabled={loading}
        >
          Rifiuta
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckIcon />}
          onClick={() => onApprove(computeFieldsToApply())}
          disabled={loading || !hasAnySelected}
        >
          Approva
        </Button>
      </Box>

    </Box>
  );
};

export default ExerciseDiff;
