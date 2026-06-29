// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState, type ReactNode } from "react";
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { StatBarInline, WORKING_AREA_LABELS, BODY_TARGET_LABELS } from "../StatBars";
import TypeSelect, { DEFAULT as TypeSelectDefaultValue } from "../TypeSelect";
import LevelSelect from "../LevelSelect";
import ArrayField from "../ArrayField";
import { movementPlans, type ExerciseImage } from "../../interfaces/exerciseInterfaces";
import { exerciseImageUrl } from "../../api/exercises";
import { capitalize } from "../../utils/stringUtils";

export const BG_CURRENT  = "#ffebee";
export const BG_PROPOSED = "#e8f5e9";

export const DISPLAY_FIELDS = [
  "instructorLevel", "type", "variant", "description", "difficultyLevel",
  "tools", "setup", "movementPlan", "workingArea", "bodyTarget", "images",
] as const;

export const FIELD_LABELS: Record<string, string> = {
  instructorLevel: "Livello",
  type:            "Tipologia",
  variant:         "Variante",
  description:     "Descrizione",
  setup:           "Setup",
  difficultyLevel: "Difficoltà",
  tools:           "Attrezzi",
  movementPlan:    "Piano di movimento",
  workingArea:     "Area target",
  bodyTarget:      "Body target",
  images:          "Immagini",
};

export type FieldSelection = Record<string, boolean | Record<string, boolean>>;

// ── Rendering valore ─────────────────────────────────────────────────────────

export const renderValue = (value: unknown): ReactNode => {
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

// Anteprime immagini: usa l'endpoint server, che risolve la key sia dalle
// immagini approvate sia da quelle ancora nel change doc (modifica in attesa).
const ImagesValue = ({ exerciseId, value }: { exerciseId?: string; value: unknown }) => {
  const list = Array.isArray(value) ? (value as ExerciseImage[]) : [];
  if (list.length === 0)
    return <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>—</Typography>;
  if (!exerciseId)
    return renderValue(list.map((img) => img.filename ?? img.id));
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
      {list.map((img) => (
        <Box
          key={img.id}
          component="img"
          src={exerciseImageUrl(exerciseId, img.id)}
          alt={img.filename ?? ""}
          sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 0.5, border: "1px solid", borderColor: "divider" }}
        />
      ))}
    </Box>
  );
};

// ── Editor in-place ──────────────────────────────────────────────────────────

interface FieldEditorProps {
  field: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

export const FieldEditor = ({ field, value, onChange }: FieldEditorProps) => {
  const [newType, setNewType] = useState(false);

  if (field === "instructorLevel") {
    const val = (value as string) ?? "BSS";
    return (
      <Box sx={{ p: 1 }}>
        <ToggleButtonGroup
          exclusive
          value={val}
          color={val === "CTS" ? "warning" : "primary"}
          onChange={(_, v) => { if (v !== null) onChange(v); }}
          size="small"
        >
          <ToggleButton value="BSS">BSS</ToggleButton>
          <ToggleButton value="CTS">CTS</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    );
  }

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
          <TypeSelect value={value as string ?? TypeSelectDefaultValue} onChangeCallback={(_, v) => onChange(v)} />
        ) : (
          <TextField fullWidth size="small" value={value as string ?? ""} onChange={(e) => onChange(capitalize(e.target.value))} />
        )}
      </Box>
    );
  }

  if (field === "difficultyLevel") {
    return (
      <Box sx={{ p: 1 }}>
        <LevelSelect value={value as number ?? 0} label="" name="difficultyLevel" useZeroValue disableAdornment onChangeCallback={(_, v) => onChange(v)} />
      </Box>
    );
  }

  if (field === "tools") {
    return <Box sx={{ p: 1 }}><ArrayField name="tools" items={value as string[] ?? []} onChange={(_, v) => onChange(v)} /></Box>;
  }

  if (field === "movementPlan") {
    return <Box sx={{ p: 1 }}><ArrayField name="movementPlan" items={value as string[] ?? []} onChange={(_, v) => onChange(v)} options={movementPlans} /></Box>;
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

// ── Cella valore ─────────────────────────────────────────────────────────────

interface ValueCellProps {
  field: string;
  currentValue: unknown;   // valore approvato; undefined = modalità nuovo esercizio
  proposed: unknown;       // valore proposto
  isChanged: boolean;
  isEditing: boolean;
  editedValue: unknown;
  onEditedChange: (value: unknown) => void;
  exerciseId?: string;     // serve a costruire gli URL delle anteprime immagini
}

const ValueCell = ({ field, currentValue, proposed, isChanged, isEditing, editedValue, onEditedChange, exerciseId }: ValueCellProps) => {
  const showCurrent = currentValue !== undefined;
  const editBg = "grey.100";

  // Le immagini non sono modificabili in review: si renderizzano come anteprime.
  const renderField = (value: unknown): ReactNode =>
    field === "images" ? <ImagesValue exerciseId={exerciseId} value={value} /> : renderValue(value);

  if (!isChanged) {
    return <Box sx={{ p: 1, opacity: 0.45 }}>{renderField(showCurrent ? currentValue : proposed)}</Box>;
  }

  return (
    <>
      {showCurrent && (
        <Box sx={{ bgcolor: BG_CURRENT, p: 1, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          {renderField(currentValue)}
        </Box>
      )}
      {isEditing && field !== "images" ? (
        <Box sx={{ bgcolor: editBg }}>
          <FieldEditor field={field} value={editedValue} onChange={onEditedChange} />
        </Box>
      ) : (
        <Box sx={{ bgcolor: BG_PROPOSED, p: 1 }}>
          {renderField(proposed)}
        </Box>
      )}
    </>
  );
};

// ── Sub-card area target / body target ────────────────────────────────────────

interface AreaSubCardsProps {
  fieldKey: string;
  currentArea: Record<string, number> | undefined;   // undefined = modalità nuovo esercizio
  proposedArea: Record<string, number>;
  subLabels: Record<string, string>;
  changedSubs: Set<string>;     // subs da evidenziare (diff o tutti in new mode)
  showCheckbox: boolean;
  subSelection: Record<string, boolean>;
  onToggleSub: (sub: string) => void;
  editingSubs: Record<string, boolean>;
  editedSubValues: Record<string, number>;
  onEditSub: (sub: string) => void;
  onEditedSubChange: (sub: string, value: number) => void;
}

const AreaSubCards = ({
  fieldKey, currentArea, proposedArea, subLabels, changedSubs, showCheckbox,
  subSelection, onToggleSub, editingSubs, editedSubValues, onEditSub, onEditedSubChange,
}: AreaSubCardsProps) => {
  const showCurrent = currentArea !== undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {Object.entries(subLabels).map(([sub, label]) => {
        const cv        = currentArea?.[sub] ?? 0;
        const pv        = proposedArea?.[sub] ?? 0;
        const changed   = changedSubs.has(sub);
        const checked   = !!subSelection[sub];
        const isEditing = !!editingSubs[sub];
        const editedVal = editedSubValues[sub] ?? pv;

        const borderColor = !changed ? "divider" : "primary.main";

        return (
          <Box key={`${fieldKey}-${sub}`} sx={{ border: 1, borderColor, borderRadius: 1, overflow: "hidden" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1, py: 0.5, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" sx={{ fontWeight: changed ? 600 : 400, color: changed ? "text.primary" : "text.disabled" }}>
                {label}
              </Typography>
              {changed && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {showCheckbox && (
                    <Checkbox size="small" checked={checked} onChange={() => onToggleSub(sub)} sx={{ p: 0 }} />
                  )}
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

            {!changed ? (
              <Box sx={{ p: 1, opacity: 0.45 }}>
                <StatBarInline value={showCurrent ? cv : pv} />
              </Box>
            ) : (
              <>
                {showCurrent && (
                  <Box sx={{ bgcolor: BG_CURRENT, p: 1, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    <StatBarInline value={cv} />
                  </Box>
                )}
                {isEditing ? (
                  <Box sx={{ bgcolor: "grey.100", p: 1 }}>
                    <ToggleButtonGroup
                      value={editedVal} exclusive size="small"
                      onChange={(_, v) => { if (v !== null) onEditedSubChange(sub, v as number); }}
                      sx={{ width: "100%", "& .MuiToggleButtonGroup-grouped": { flex: 1, minWidth: 0, py: 0.25 } }}
                    >
                      {[0, 1, 2, 3, 4, 5].map((v) => <ToggleButton key={v} value={v}>{v}</ToggleButton>)}
                    </ToggleButtonGroup>
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
};

// ── Sub-card immagini ─────────────────────────────────────────────────────────

interface ImageSubCardsProps {
  exerciseId?: string;
  currentImages: ExerciseImage[];
  proposedImages: ExerciseImage[];
  showCheckbox: boolean;
  imageSelection: Record<string, boolean>;
  onToggleImage: (imageId: string) => void;
}

const ImageSubCards = ({
  exerciseId, currentImages, proposedImages, showCheckbox, imageSelection, onToggleImage,
}: ImageSubCardsProps) => {
  const currentIds  = new Set(currentImages.map((img) => img.id));
  const proposedIds = new Set(proposedImages.map((img) => img.id));

  const keptImages    = currentImages.filter((img) =>  proposedIds.has(img.id));
  const removedImages = currentImages.filter((img) => !proposedIds.has(img.id));
  const addedImages   = proposedImages.filter((img) => !currentIds.has(img.id));

  const thumbSx = {
    width: 72, height: 72, objectFit: "cover" as const,
    borderRadius: 0.5, border: "1px solid", borderColor: "divider", display: "block",
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {keptImages.map((img) => (
        <Box key={img.id} sx={{ opacity: 0.45 }}>
          <Box component="img"
            src={exerciseId ? exerciseImageUrl(exerciseId, img.id) : undefined}
            alt={img.filename ?? ""}
            sx={thumbSx}
          />
        </Box>
      ))}
      {removedImages.map((img) => {
        const removing = imageSelection[img.id] !== false; // true di default → rimozione applicata
        return (
          <Box key={img.id} sx={{ border: 1, borderColor: "error.main", borderRadius: 0.5, overflow: "hidden" }}>
            <Box sx={{ px: 0.5, py: 0.25, bgcolor: BG_CURRENT, display: "flex", alignItems: "center", gap: 0.5 }}>
              {showCheckbox && (
                <Checkbox size="small" checked={removing} onChange={() => onToggleImage(img.id)} sx={{ p: 0 }} />
              )}
            </Box>
            <Box component="img"
              src={exerciseId ? exerciseImageUrl(exerciseId, img.id) : undefined}
              alt={img.filename ?? ""}
              sx={{ ...thumbSx, opacity: removing ? 0.35 : 1 }}
            />
          </Box>
        );
      })}
      {addedImages.map((img) => {
        const checked = !!imageSelection[img.id];
        return (
          <Box key={img.id} sx={{ border: 1, borderColor: "success.main", borderRadius: 0.5, overflow: "hidden" }}>
            {showCheckbox && (
              <Box sx={{ px: 0.5, py: 0.25, bgcolor: BG_PROPOSED, display: "flex", alignItems: "center" }}>
                <Checkbox size="small" checked={checked} onChange={() => onToggleImage(img.id)} sx={{ p: 0 }} />
              </Box>
            )}
            <Box component="img"
              src={exerciseId ? exerciseImageUrl(exerciseId, img.id) : undefined}
              alt={img.filename ?? ""}
              sx={{ ...thumbSx, opacity: checked || !showCheckbox ? 1 : 0.35 }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

// ── Props principali ─────────────────────────────────────────────────────────

export interface ExerciseReviewTableProps {
  // Valori proposti/nuovi (ciò che va in verde)
  proposed: Record<string, unknown>;
  // Valori approvati correnti: se assente → modalità nuovo esercizio (solo verde, no rosso)
  original?: Record<string, unknown>;
  // Id dell'esercizio: usato per costruire gli URL delle anteprime immagini
  exerciseId?: string;
  // Campi da evidenziare con pencil: in change mode = Object.keys(change.fields), in new mode = tutti
  changedFields: string[];
  // Checkbox per selezione selettiva (solo change mode)
  showCheckboxes?: boolean;
  fieldSelection?: FieldSelection;
  onToggleField?: (field: string) => void;
  onToggleSubField?: (field: string, sub: string) => void;
  // Stato editing (condiviso tra le due modalità)
  editingFields: Record<string, boolean>;
  editedValues: Record<string, unknown>;
  editingSubFields: Record<string, Record<string, boolean>>;
  editedSubValues: Record<string, Record<string, number>>;
  onToggleEditField: (field: string) => void;
  onEditedChange: (field: string, value: unknown) => void;
  onToggleEditSubField: (areaField: string, sub: string) => void;
  onEditedSubChange: (areaField: string, sub: string, value: number) => void;
}

// ── Componente ───────────────────────────────────────────────────────────────

const ExerciseReviewTable = ({
  proposed, original, exerciseId, changedFields, showCheckboxes = false,
  fieldSelection = {}, onToggleField, onToggleSubField,
  editingFields, editedValues, editingSubFields, editedSubValues,
  onToggleEditField, onEditedChange, onToggleEditSubField, onEditedSubChange,
}: ExerciseReviewTableProps) => {
  const showCurrent = original !== undefined;

  // Helper: calcola quali sub-campi area sono effettivamente diversi
  const computeChangedSubs = (areaKey: "workingArea" | "bodyTarget", subLabels: Record<string, string>): Set<string> => {
    const isAreaChanged = changedFields.includes(areaKey);
    if (!isAreaChanged) return new Set();
    if (!showCurrent) return new Set(Object.keys(subLabels));
    const origArea  = original![areaKey] as Record<string, number> | undefined;
    const propArea  = proposed[areaKey] as Record<string, number> | undefined;
    return new Set(Object.keys(subLabels).filter(s => (origArea?.[s] ?? 0) !== (propArea?.[s] ?? 0)));
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: showCheckboxes ? 40 : 28, px: 0.5 }} />
            <TableCell sx={{ fontWeight: "bold", width: 160 }}>Campo</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Valore</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {DISPLAY_FIELDS.map((field) => {
            const isChanged = changedFields.includes(field);

            // workingArea e bodyTarget: riga unica 2 colonne
            if (field === "workingArea") {
              const waSubSel = (fieldSelection["workingArea"] as Record<string, boolean>) ?? {};
              const btSubSel = (fieldSelection["bodyTarget"]  as Record<string, boolean>) ?? {};
              const waChangedSubs = computeChangedSubs("workingArea", WORKING_AREA_LABELS);
              const btChangedSubs = computeChangedSubs("bodyTarget",  BODY_TARGET_LABELS);

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
                          currentArea={showCurrent ? (original!.workingArea as Record<string, number>) : undefined}
                          proposedArea={(proposed.workingArea ?? {}) as Record<string, number>}
                          subLabels={WORKING_AREA_LABELS}
                          changedSubs={waChangedSubs}
                          showCheckbox={showCheckboxes}
                          subSelection={waSubSel}
                          onToggleSub={(sub) => onToggleSubField?.("workingArea", sub)}
                          editingSubs={editingSubFields["workingArea"] ?? {}}
                          editedSubValues={editedSubValues["workingArea"] ?? {}}
                          onEditSub={(sub) => onToggleEditSubField("workingArea", sub)}
                          onEditedSubChange={(sub, v) => onEditedSubChange("workingArea", sub, v)}
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: "bold", fontSize: 13, px: 1, py: 0.75, bgcolor: "grey.100", borderRadius: 0.5, mb: 1 }}>
                          {FIELD_LABELS.bodyTarget}
                        </Typography>
                        <AreaSubCards
                          fieldKey="bodyTarget"
                          currentArea={showCurrent ? (original!.bodyTarget as Record<string, number>) : undefined}
                          proposedArea={(proposed.bodyTarget ?? {}) as Record<string, number>}
                          subLabels={BODY_TARGET_LABELS}
                          changedSubs={btChangedSubs}
                          showCheckbox={showCheckboxes}
                          subSelection={btSubSel}
                          onToggleSub={(sub) => onToggleSubField?.("bodyTarget", sub)}
                          editingSubs={editingSubFields["bodyTarget"] ?? {}}
                          editedSubValues={editedSubValues["bodyTarget"] ?? {}}
                          onEditSub={(sub) => onToggleEditSubField("bodyTarget", sub)}
                          onEditedSubChange={(sub, v) => onEditedSubChange("bodyTarget", sub, v)}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            }

            if (field === "bodyTarget") return null;

            // Immagini in modalità sub-selezione per-immagine (change mode con aggiunte)
            if (
              field === "images" &&
              typeof fieldSelection["images"] === "object" &&
              fieldSelection["images"] !== null
            ) {
              const imageSelection = fieldSelection["images"] as Record<string, boolean>;
              const currentImgs  = ((original?.images  ?? []) as ExerciseImage[]);
              const proposedImgs = ((proposed.images ?? []) as ExerciseImage[]);
              return (
                <TableRow key="images">
                  <TableCell colSpan={3} sx={{ p: 1 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: 13, px: 1, py: 0.75, bgcolor: "grey.100", borderRadius: 0.5, mb: 1 }}>
                      {FIELD_LABELS.images}
                    </Typography>
                    <ImageSubCards
                      exerciseId={exerciseId}
                      currentImages={currentImgs}
                      proposedImages={proposedImgs}
                      showCheckbox={showCheckboxes}
                      imageSelection={imageSelection}
                      onToggleImage={(imgId) => onToggleSubField?.("images", imgId)}
                    />
                  </TableCell>
                </TableRow>
              );
            }

            const checked   = isChanged && !!fieldSelection[field];
            const isEditing = isChanged && !!editingFields[field];

            return (
              <TableRow key={field}>
                <TableCell sx={{ width: showCheckboxes ? 40 : 28, px: 0.5, verticalAlign: "top" }}>
                  {isChanged && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {showCheckboxes && onToggleField && (
                        <Checkbox size="small" checked={checked} onChange={() => onToggleField(field)} sx={{ p: 0 }} />
                      )}
                      {field !== "images" && (
                        <Tooltip title={isEditing ? "Annulla modifica" : "Modifica valore"}>
                          <IconButton size="small" sx={{ p: 0 }} onClick={() => onToggleEditField(field)}>
                            {isEditing
                              ? <CloseIcon sx={{ fontSize: 14, color: "error.main" }} />
                              : <EditOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: isChanged ? 600 : 400, color: isChanged ? "text.primary" : "text.disabled", verticalAlign: "top", fontSize: 13 }}>
                  {FIELD_LABELS[field] ?? field}
                </TableCell>
                <TableCell sx={{ p: 0, verticalAlign: "top" }}>
                  <ValueCell
                    field={field}
                    currentValue={original?.[field]}
                    proposed={proposed[field]}
                    isChanged={isChanged}
                    isEditing={isEditing}
                    editedValue={editedValues[field]}
                    onEditedChange={(v) => onEditedChange(field, v)}
                    exerciseId={exerciseId}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExerciseReviewTable;
