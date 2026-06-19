// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useEffect, useState } from "react";
import { Box, Button, Divider, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { PendingItem } from "../../interfaces/adminInterfaces";
import { WORKING_AREA_LABELS, BODY_TARGET_LABELS } from "../StatBars";
import ExerciseReviewTable, { type FieldSelection } from "./ExerciseReviewTable";

interface ExerciseDiffProps {
  item: PendingItem;
  onApprove: (fieldsToApply: Record<string, unknown>) => void;
  onReject: () => void;
  loading: boolean;
}

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

  const changedFields = Object.keys(change.fields);
  const exerciseAsMap = exercise as unknown as Record<string, unknown>;
  const changedAsMap  = change.fields as Record<string, unknown>;

  const toggleField = (field: string) =>
    setFieldSelection((prev) => ({ ...prev, [field]: !prev[field] }));

  const toggleSubField = (field: string, sub: string) =>
    setFieldSelection((prev) => {
      const subSel = (prev[field] as Record<string, boolean>) ?? {};
      return { ...prev, [field]: { ...subSel, [sub]: !subSel[sub] } };
    });

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

  const toggleEditSubField = (areaField: string, sub: string) => {
    setEditingSubFields((prev) => {
      const prevArea   = prev[areaField] ?? {};
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

        <ExerciseReviewTable
          proposed={changedAsMap}
          original={exerciseAsMap}
          changedFields={changedFields}
          showCheckboxes
          fieldSelection={fieldSelection}
          onToggleField={toggleField}
          onToggleSubField={toggleSubField}
          editingFields={editingFields}
          editedValues={editedValues}
          editingSubFields={editingSubFields}
          editedSubValues={editedSubValues}
          onToggleEditField={toggleEditField}
          onEditedChange={handleEditedChange}
          onToggleEditSubField={toggleEditSubField}
          onEditedSubChange={handleEditedSubChange}
        />
      </Box>

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
