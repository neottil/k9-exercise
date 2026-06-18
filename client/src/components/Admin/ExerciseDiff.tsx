// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import type { PendingItem } from "../../interfaces/adminInterfaces";
import { StatBarInline, WORKING_AREA_LABELS, BODY_TARGET_LABELS } from "../StatBars";
import TypeSelect, { DEFAULT as TypeSelectDefaultValue } from "../TypeSelect";
import LevelSelect from "../LevelSelect";
import ArrayField from "../ArrayField";
import { movementPlans } from "../../interfaces/exerciseInterfaces";
import { capitalize } from "../../utils/stringUtils";

const BG_CURRENT  = "#ffebee";
const BG_PROPOSED = "#e8f5e9";

const DISPLAY_FIELDS = [
  "type", "variant", "description", "difficultyLevel",
  "tools", "setup", "movementPlan", "workingArea", "bodyTarget",
] as const;

const FIELD_LABELS: Record<string, string> = {
  type:            "Tipologia",
  variant:         "Variante",
  description:     "Descrizione",
  setup:           "Setup",
  difficultyLevel: "Difficoltà",
  tools:           "Attrezzi",
  movementPlan:    "Piano di movimento",
  workingArea:     "Area target",
  bodyTarget:      "Body target",
};

type FieldSelection = Record<string, boolean | Record<string, boolean>>;

// ── Rendering valore ─────────────────────────────────────────────────────────

const renderValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined || value === "")
    return <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>—</Typography>;
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>—</Typography>;
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
        {(value as unknown[]).map((v, i) => <Chip key={i} label={String(v)} size="small" />)}
      </Box>
    );
  }
  return <Typography variant="body2">{String(value)}</Typography>;
};

// ── Editor in-place: sostituisce il box verde proposto ───────────────────────

interface FieldEditorProps {
  field: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

const FieldEditor = ({ field, value, onChange }: FieldEditorProps) => {
  const [newType, setNewType] = useState(false);

  if (field === "type") {
    return (
      <Box sx={{ p: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
          <FormControlLabel
            label="Nuova"
            control={
              <Switch
                size="small"
                checked={newType}
                onChange={(e) => { setNewType(e.target.checked); onChange(TypeSelectDefaultValue); }}
              />
            }
            sx={{ m: 0 }}
          />
        </Box>
        {!newType ? (
          <TypeSelect
            value={value as string ?? TypeSelectDefaultValue}
            onChangeCallback={(_, v) => onChange(v)}
          />
        ) : (
          <TextField
            fullWidth size="small"
            value={value as string ?? ""}
            onChange={(e) => onChange(capitalize(e.target.value))}
          />
        )}
      </Box>
    );
  }

  if (field === "difficultyLevel") {
    return (
      <Box sx={{ p: 1 }}>
        <LevelSelect
          value={value as number ?? 0}
          label="" name="difficultyLevel"
          useZeroValue disableAdornment
          onChangeCallback={(_, v) => onChange(v)}
        />
      </Box>
    );
  }

  if (field === "tools") {
    return (
      <Box sx={{ p: 1 }}>
        <ArrayField
          name="tools"
          items={value as string[] ?? []}
          onChange={(_, v) => onChange(v)}
        />
      </Box>
    );
  }

  if (field === "movementPlan") {
    return (
      <Box sx={{ p: 1 }}>
        <ArrayField
          name="movementPlan"
          items={value as string[] ?? []}
          onChange={(_, v) => onChange(v)}
          options={movementPlans}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <TextField
        fullWidth size="small"
        multiline={field === "description" || field === "setup"}
        minRows={field === "description" || field === "setup" ? 2 : 1}
        value={value as string ?? ""}
        onChange={(e) => onChange(capitalize(e.target.value))}
      />
    </Box>
  );
};

// ── Cella valore: rosso (attuale) sopra, verde (proposto o editor) sotto ─────

interface ValueCellProps {
  field: string;
  current: unknown;
  proposed: unknown;
  isChanged: boolean;
  isEditing: boolean;
  editedValue: unknown;
  onEditedChange: (value: unknown) => void;
}

const ValueCell = ({ field, current, proposed, isChanged, isEditing, editedValue, onEditedChange }: ValueCellProps) => {
  if (!isChanged) {
    return <Box sx={{ p: 1, opacity: 0.45 }}>{renderValue(current)}</Box>;
  }
  return (
    <>
      <Box sx={{ bgcolor: BG_CURRENT, p: 1, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        {renderValue(current)}
      </Box>
      {isEditing ? (
        <Box sx={{ bgcolor: BG_PROPOSED }}>
          <FieldEditor field={field} value={editedValue} onChange={onEditedChange} />
        </Box>
      ) : (
        <Box sx={{ bgcolor: BG_PROPOSED, p: 1 }}>
          {renderValue(proposed)}
        </Box>
      )}
    </>
  );
};

// ── Sub-card area target / body target ────────────────────────────────────────

interface AreaSubCardsProps {
  fieldKey: string;
  current: Record<string, number> | undefined;
  proposed: Record<string, number> | null;
  subLabels: Record<string, string>;
  subSelection: Record<string, boolean>;
  onToggleSub: (sub: string) => void;
  editingSubs: Record<string, boolean>;
  editedSubValues: Record<string, number>;
  onEditSub: (sub: string) => void;
  onEditedSubChange: (sub: string, value: number) => void;
}

const AreaSubCards = ({
  fieldKey, current, proposed, subLabels, subSelection, onToggleSub,
  editingSubs, editedSubValues, onEditSub, onEditedSubChange,
}: AreaSubCardsProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    {Object.entries(subLabels).map(([sub, label]) => {
      const cv        = current?.[sub] ?? 0;
      const pv        = proposed?.[sub] ?? 0;
      const changed   = proposed !== null && cv !== pv;
      const checked   = !!subSelection[sub];
      const isEditing = !!editingSubs[sub];
      const editedVal = editedSubValues[sub] ?? pv;
      return (
        <Box
          key={`${fieldKey}-${sub}`}
          sx={{
            border: 1,
            borderColor: changed && checked ? "primary.main" : changed ? "warning.light" : "divider",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          {/* Header: etichetta + checkbox + edit icon */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1, py: 0.5, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" sx={{ fontWeight: changed ? 600 : 400, color: changed ? "text.primary" : "text.disabled" }}>
              {label}
            </Typography>
            {changed && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Checkbox size="small" checked={checked} onChange={() => onToggleSub(sub)} sx={{ p: 0 }} />
                <Tooltip title={isEditing ? "Annulla modifica" : "Modifica valore"}>
                  <IconButton size="small" sx={{ p: 0 }} onClick={() => onEditSub(sub)}>
                    {isEditing
                      ? <CloseIcon sx={{ fontSize: 14, color: "error.main" }} />
                      : <EditOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Valore / diff / slider editor */}
          {!changed ? (
            <Box sx={{ p: 1, opacity: 0.45 }}>
              <StatBarInline value={cv} />
            </Box>
          ) : (
            <>
              <Box sx={{ bgcolor: BG_CURRENT, p: 1, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <StatBarInline value={cv} />
              </Box>
              {isEditing ? (
                <Box sx={{ bgcolor: BG_PROPOSED, px: 2, py: 1 }}>
                  <Slider
                    size="small" min={0} max={10} step={1} marks
                    value={editedVal}
                    onChange={(_, v) => onEditedSubChange(sub, v as number)}
                    valueLabelDisplay="auto"
                    color="success"
                  />
                </Box>
              ) : (
                <Box sx={{ bgcolor: BG_PROPOSED, p: 1 }}>
                  <StatBarInline value={pv} />
                </Box>
              )}
            </>
          )}
        </Box>
      );
    })}
  </Box>
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExerciseDiffProps {
  item: PendingItem;
  onApprove: (fieldsToApply: Record<string, unknown>) => void;
  onReject: () => void;
  loading: boolean;
}

// ── Componente principale ─────────────────────────────────────────────────────

const ExerciseDiff = ({ item, onApprove, onReject, loading }: ExerciseDiffProps) => {
  const { exercise, change } = item;

  const [fieldSelection,   setFieldSelection]   = useState<FieldSelection>({});
  const [editingFields,    setEditingFields]    = useState<Record<string, boolean>>({});
  const [editedValues,     setEditedValues]     = useState<Record<string, unknown>>({});
  const [editingSubFields, setEditingSubFields] = useState<Record<string, Record<string, boolean>>>({});
  const [editedSubValues,  setEditedSubValues]  = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (!item.change) {
      setFieldSelection({});
      setEditingFields({});
      setEditedValues({});
      setEditingSubFields({});
      setEditedSubValues({});
      return;
    }
    const exMap = item.exercise as unknown as Record<string, unknown>;
    const chMap = item.change.fields as Record<string, unknown>;

    const initial: FieldSelection = {};
    for (const field of Object.keys(chMap)) {
      if (field === "workingArea" || field === "bodyTarget") {
        const subLabels = field === "workingArea" ? WORKING_AREA_LABELS : BODY_TARGET_LABELS;
        const cur  = exMap[field] as Record<string, number> | undefined;
        const prop = chMap[field] as Record<string, number>;
        const subSel: Record<string, boolean> = {};
        for (const sub of Object.keys(subLabels)) {
          if ((cur?.[sub] ?? 0) !== (prop[sub] ?? 0)) subSel[sub] = true;
        }
        initial[field] = subSel;
      } else {
        initial[field] = true;
      }
    }
    setFieldSelection(initial);
    setEditingFields({});
    setEditedValues({});
    setEditingSubFields({});
    setEditedSubValues({});
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

  // Attiva editing per un campo semplice; pre-carica il valore proposto e auto-seleziona la checkbox.
  // Se l'editing è già attivo (click sulla X), cancella il valore editato così verrà usato il proposto.
  const toggleEditField = (field: string) => {
    setEditingFields((prev) => {
      const nowEditing = !prev[field];
      if (nowEditing) {
        setEditedValues((ev) => ({ ...ev, [field]: changedAsMap[field] }));
        setFieldSelection((fs) => ({ ...fs, [field]: true }));
      } else {
        setEditedValues((ev) => { const next = { ...ev }; delete next[field]; return next; });
      }
      return { ...prev, [field]: nowEditing };
    });
  };

  const handleEditedChange = (field: string, value: unknown) =>
    setEditedValues((prev) => ({ ...prev, [field]: value }));

  // Attiva editing per un sotto-campo area; pre-carica valore proposto e auto-seleziona checkbox.
  // Se già in edit (click sulla X), cancella il valore editato così verrà usato il proposto.
  const toggleEditSubField = (areaField: string, sub: string) => {
    setEditingSubFields((prev) => {
      const prevArea  = prev[areaField] ?? {};
      const nowEditing = !prevArea[sub];
      if (nowEditing) {
        const prop = changedAsMap[areaField] as Record<string, number> | undefined;
        setEditedSubValues((ev) => ({ ...ev, [areaField]: { ...(ev[areaField] ?? {}), [sub]: prop?.[sub] ?? 0 } }));
        setFieldSelection((fs) => {
          const subSel = (fs[areaField] as Record<string, boolean>) ?? {};
          return { ...fs, [areaField]: { ...subSel, [sub]: true } };
        });
      } else {
        setEditedSubValues((ev) => {
          const area = { ...(ev[areaField] ?? {}) };
          delete area[sub];
          return { ...ev, [areaField]: area };
        });
      }
      return { ...prev, [areaField]: { ...prevArea, [sub]: nowEditing } };
    });
  };

  const handleEditedSubChange = (areaField: string, sub: string, value: number) =>
    setEditedSubValues((prev) => ({ ...prev, [areaField]: { ...(prev[areaField] ?? {}), [sub]: value } }));

  const hasAnySelected = Object.entries(fieldSelection).some(([field, sel]) => {
    if (field === "workingArea" || field === "bodyTarget")
      return Object.values(sel as Record<string, boolean>).some((v) => v);
    return !!sel;
  });

  // Costruisce il payload: per ogni campo selezionato usa il valore editato se l'admin ha modificato
  const computeFieldsToApply = (): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const field of changedFields) {
      const sel = fieldSelection[field];
      if (field === "workingArea" || field === "bodyTarget") {
        const subSel = sel as Record<string, boolean> | undefined;
        if (!subSel || Object.values(subSel).every((v) => !v)) continue;
        const current    = (exerciseAsMap[field] as Record<string, number>) ?? {};
        const proposed   = changedAsMap[field] as Record<string, number>;
        const editedArea = editedSubValues[field] ?? {};
        const merged: Record<string, number> = { ...current };
        for (const [sub, checked] of Object.entries(subSel)) {
          if (checked) merged[sub] = editedArea[sub] !== undefined ? editedArea[sub] : (proposed[sub] ?? 0);
        }
        result[field] = merged;
      } else {
        if (sel) result[field] = editedValues[field] !== undefined ? editedValues[field] : changedAsMap[field];
      }
    }
    return result;
  };

  const formattedDate = change.updatedAt
    ? new Date(change.updatedAt).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Area scrollabile */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>

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

                // workingArea e bodyTarget: riga unica a 2 colonne affiancate
                if (field === "workingArea") {
                  const waIsChanged = isChanged;
                  const btIsChanged = changedFields.includes("bodyTarget");
                  const waSubSel    = (fieldSelection["workingArea"] as Record<string, boolean>) ?? {};
                  const btSubSel    = (fieldSelection["bodyTarget"]  as Record<string, boolean>) ?? {};
                  return (
                    <TableRow key="areas-combined">
                      <TableCell colSpan={3} sx={{ p: 1 }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                          <Box>
                            <Typography sx={{ fontWeight: "bold", fontSize: 13, px: 1, py: 0.75, bgcolor: "grey.100", borderRadius: 0.5, mb: 1 }}>
                              {FIELD_LABELS.workingArea}
                            </Typography>
                            <AreaSubCards
                              fieldKey="workingArea"
                              current={current as Record<string, number>}
                              proposed={waIsChanged ? (proposed as Record<string, number>) : null}
                              subLabels={WORKING_AREA_LABELS}
                              subSelection={waSubSel}
                              onToggleSub={(sub) => toggleSubField("workingArea", sub)}
                              editingSubs={editingSubFields["workingArea"] ?? {}}
                              editedSubValues={editedSubValues["workingArea"] ?? {}}
                              onEditSub={(sub) => toggleEditSubField("workingArea", sub)}
                              onEditedSubChange={(sub, v) => handleEditedSubChange("workingArea", sub, v)}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: "bold", fontSize: 13, px: 1, py: 0.75, bgcolor: "grey.100", borderRadius: 0.5, mb: 1 }}>
                              {FIELD_LABELS.bodyTarget}
                            </Typography>
                            <AreaSubCards
                              fieldKey="bodyTarget"
                              current={exerciseAsMap["bodyTarget"] as Record<string, number>}
                              proposed={btIsChanged ? (changedAsMap["bodyTarget"] as Record<string, number>) : null}
                              subLabels={BODY_TARGET_LABELS}
                              subSelection={btSubSel}
                              onToggleSub={(sub) => toggleSubField("bodyTarget", sub)}
                              editingSubs={editingSubFields["bodyTarget"] ?? {}}
                              editedSubValues={editedSubValues["bodyTarget"] ?? {}}
                              onEditSub={(sub) => toggleEditSubField("bodyTarget", sub)}
                              onEditedSubChange={(sub, v) => handleEditedSubChange("bodyTarget", sub, v)}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                }

                // bodyTarget già incluso nella riga workingArea
                if (field === "bodyTarget") return null;

                const checked   = isChanged && !!fieldSelection[field];
                const isEditing = isChanged && !!editingFields[field];
                return (
                  <TableRow key={field}>
                    <TableCell sx={{ width: 40, px: 0.5, verticalAlign: "top" }}>
                      {isChanged && (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <Checkbox size="small" checked={checked} onChange={() => toggleField(field)} sx={{ p: 0 }} />
                          <Tooltip title={isEditing ? "Annulla modifica" : "Modifica valore"}>
                            <IconButton size="small" sx={{ p: 0 }} onClick={() => toggleEditField(field)}>
                              {isEditing
                                ? <CloseIcon sx={{ fontSize: 14, color: "error.main" }} />
                                : <EditOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: isChanged ? 600 : 400, color: isChanged ? "text.primary" : "text.disabled", verticalAlign: "top", fontSize: 13 }}>
                      {FIELD_LABELS[field] ?? field}
                    </TableCell>
                    <TableCell sx={{ p: 0, verticalAlign: "top" }}>
                      <ValueCell
                        field={field}
                        current={current}
                        proposed={proposed}
                        isChanged={isChanged}
                        isEditing={isEditing}
                        editedValue={editedValues[field]}
                        onEditedChange={(v) => handleEditedChange(field, v)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

      </Box>

      {/* Pulsanti fissi */}
      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider", display: "flex", gap: 2, justifyContent: "flex-end", flexShrink: 0 }}>
        <Button variant="contained" color="error" startIcon={<CloseIcon />} onClick={onReject} disabled={loading}>
          Rifiuta
        </Button>
        <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => onApprove(computeFieldsToApply())} disabled={loading || !hasAnySelected}>
          Approva
        </Button>
      </Box>

    </Box>
  );
};

export default ExerciseDiff;
