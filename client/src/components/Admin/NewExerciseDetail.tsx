// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState } from "react";
import { Box, Button, Divider, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { NewExercise } from "../../interfaces/adminInterfaces";
import type { Exercise } from "../../interfaces/exerciseInterfaces";
import ExerciseReviewTable, { DISPLAY_FIELDS } from "./ExerciseReviewTable";

interface NewExerciseDetailProps {
  exercise: NewExercise;
  onApprove: (exercise: Exercise) => void;
  onReject: () => void;
  loading: boolean;
}

const NewExerciseDetail = ({ exercise, onApprove, onReject, loading }: NewExerciseDetailProps) => {
  const [editingFields,    setEditingFields]    = useState<Record<string, boolean>>({});
  const [editedValues,     setEditedValues]     = useState<Record<string, unknown>>({});
  const [editingSubFields, setEditingSubFields] = useState<Record<string, Record<string, boolean>>>({});
  const [editedSubValues,  setEditedSubValues]  = useState<Record<string, Record<string, number>>>({});

  const exerciseAsMap = exercise as unknown as Record<string, unknown>;

  const toggleEditField = (field: string) => {
    setEditingFields((prev) => {
      const nowEditing = !prev[field];
      if (nowEditing) {
        setEditedValues((ev) => ({ ...ev, [field]: exerciseAsMap[field] }));
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
        const baseArea = exerciseAsMap[areaField] as Record<string, number> | undefined;
        setEditedSubValues((ev) => ({ ...ev, [areaField]: { ...(ev[areaField] ?? {}), [sub]: baseArea?.[sub] ?? 0 } }));
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

  const computeFinalExercise = (): Exercise => {
    const result = { ...exerciseAsMap };
    for (const field of DISPLAY_FIELDS) {
      if (field === "workingArea" || field === "bodyTarget") {
        if (editedSubValues[field] && Object.keys(editedSubValues[field]).length > 0) {
          result[field] = { ...(exerciseAsMap[field] as Record<string, number> ?? {}), ...editedSubValues[field] };
        }
      } else if (editedValues[field] !== undefined) {
        result[field] = editedValues[field];
      }
    }
    return result as unknown as Exercise;
  };

  const formattedDate = exercise.createdAt
    ? new Date(exercise.createdAt).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })
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
            Inserito da <strong>{exercise.user || "—"}</strong> il {formattedDate}
          </Typography>
        </Box>

        <Divider />

        <ExerciseReviewTable
          proposed={exerciseAsMap}
          exerciseId={exercise.id}
          changedFields={[...DISPLAY_FIELDS]}
          showCheckboxes={false}
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
        <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => onApprove(computeFinalExercise())} disabled={loading}>
          Approva
        </Button>
      </Box>

    </Box>
  );
};

export default NewExerciseDetail;
