// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState, type ChangeEvent } from "react";
import {
  Box,
  FormControlLabel,
  InputLabel,
  Switch,
  TextField,
} from "@mui/material";
import { StatBarsField, WORKING_AREA_LABELS, BODY_TARGET_LABELS } from "../StatBars";
import TypeSelect, { DEFAULT as TypeSelectDefaultValue } from "../TypeSelect";
import ArrayField from "../ArrayField";
import LevelSelect from "../LevelSelect";
import { type Exercise, movementPlans } from "../../interfaces/exerciseInterfaces";
import { capitalize } from "../../utils/stringUtils";

export interface ExerciseFormProps {
  exercise: Exercise;
  onChange: (name: string, value: string | string[] | number) => void;
}

const ExerciseForm = ({ exercise, onChange }: ExerciseFormProps) => {
  const [newType, setNewType] = useState(false);

  const onTextChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.name, capitalize(e.target.value));
  };

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gridTemplateAreas: {
          xs: `
            "type"
            "variant"
            "description"
            "piano"
            "tools"
            "setup"
            "area"
          `,
          md: `
            "type variant"
            "description piano"
            "tools setup"
            "area area"
          `,
        },
      }}
    >
      {/* Difficoltà + Tipologia */}
      <Box sx={{ gridArea: "type" }}>
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <InputLabel required>Difficoltà</InputLabel>
            <LevelSelect
              value={exercise.difficultyLevel}
              label=""
              name="difficultyLevel"
              useZeroValue
              disableAdornment
              onChangeCallback={onChange}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <InputLabel required>Tipologia</InputLabel>
              <FormControlLabel
                label="Nuova"
                control={
                  <Switch
                    size="small"
                    checked={newType}
                    onChange={(e) => {
                      setNewType(e.target.checked);
                      onChange("type", TypeSelectDefaultValue);
                    }}
                  />
                }
                sx={{ mr: 0, ml: 1 }}
              />
            </Box>
            {!newType ? (
              <TypeSelect
                onChangeCallback={onChange}
                value={exercise.type || TypeSelectDefaultValue}
              />
            ) : (
              <TextField
                fullWidth
                name="type"
                value={exercise.type}
                onChange={onTextChange}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Variante */}
      <Box sx={{ gridArea: "variant" }}>
        <InputLabel>Variante</InputLabel>
        <TextField
          fullWidth
          name="variant"
          value={exercise.variant ?? ""}
          onChange={onTextChange}
        />
      </Box>

      {/* Descrizione */}
      <Box sx={{ gridArea: "description" }}>
        <InputLabel required>Descrizione</InputLabel>
        <TextField
          fullWidth
          name="description"
          value={exercise.description ?? ""}
          onChange={onTextChange}
          multiline
          minRows={2}
        />
      </Box>

      {/* Setup */}
      <Box sx={{ gridArea: "setup" }}>
        <InputLabel required={exercise.tools.length > 0}>Setup</InputLabel>
        <TextField
          fullWidth
          name="setup"
          value={exercise.setup ?? ""}
          onChange={onTextChange}
          multiline
          minRows={2}
        />
      </Box>

      {/* Attrezzi */}
      <Box sx={{ gridArea: "tools" }}>
        <InputLabel>Attrezzi</InputLabel>
        <ArrayField
          name="tools"
          items={exercise.tools ?? []}
          onChange={onChange}
        />
      </Box>

      {/* Piano di movimento */}
      <Box sx={{ gridArea: "piano" }}>
        <InputLabel required>Piano di movimento</InputLabel>
        <ArrayField
          name="movementPlan"
          items={exercise.movementPlan ?? []}
          onChange={onChange}
          options={movementPlans}
        />
      </Box>

      {/* Area target + Body target */}
      <Box
        sx={{
          gridArea: "area",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Box>
          <InputLabel required>Area target</InputLabel>
          <StatBarsField
            data={exercise.workingArea as unknown as Record<string, number>}
            labels={WORKING_AREA_LABELS}
            fieldPrefix="workingArea"
            onChange={onChange}
          />
        </Box>
        <Box>
          <InputLabel required>Body target</InputLabel>
          <StatBarsField
            data={exercise.bodyTarget as unknown as Record<string, number>}
            labels={BODY_TARGET_LABELS}
            fieldPrefix="bodyTarget"
            onChange={onChange}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ExerciseForm;
