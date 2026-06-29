// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState, type ChangeEvent } from "react";
import {
  Box,
  FormControlLabel,
  InputLabel,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { StatBarsField, WORKING_AREA_LABELS, BODY_TARGET_LABELS } from "../StatBars";
import TypeSelect, { DEFAULT as TypeSelectDefaultValue } from "../TypeSelect";
import ArrayField from "../ArrayField";
import LevelSelect from "../LevelSelect";
import ImagesField from "./ImagesField";
import { type Exercise, movementPlans, MAX_IMAGES } from "../../interfaces/exerciseInterfaces";
import { capitalize } from "../../utils/stringUtils";

export interface ExerciseFormProps {
  exercise: Exercise;
  onChange: (name: string, value: string | string[] | number) => void;
  newImages: File[];
  onAddImages: (files: File[]) => void;
  onRemoveExistingImage: (id: string) => void;
  onRemoveNewImage: (index: number) => void;
}

const ExerciseForm = ({
  exercise,
  onChange,
  newImages,
  onAddImages,
  onRemoveExistingImage,
  onRemoveNewImage,
}: ExerciseFormProps) => {
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
            "images"
          `,
          md: `
            "type variant"
            "description piano"
            "tools setup"
            "area area"
            "images images"
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

      {/* Variante + Livello */}
      <Box sx={{ gridArea: "variant", display: "flex", gap: 2 }}>
        <Box sx={{ flex: 7 }}>
          <InputLabel>Variante</InputLabel>
          <TextField
            fullWidth
            name="variant"
            value={exercise.variant ?? ""}
            onChange={onTextChange}
          />
        </Box>
        <Box sx={{ flex: 3 }}>
          <InputLabel required>Livello</InputLabel>
          <ToggleButtonGroup
            exclusive
            value={exercise.instructorLevel ?? "BSS"}
            color={exercise.instructorLevel === "CTS" ? "warning" : "primary"}
            onChange={(_, v) => { if (v !== null) onChange("instructorLevel", v as string); }}
            size="small"
            fullWidth
            sx={{ mt: 0.5 }}
          >
            <ToggleButton value="BSS" sx={{ flex: 1 }}>BSS</ToggleButton>
            <ToggleButton value="CTS" sx={{ flex: 1 }}>CTS</ToggleButton>
          </ToggleButtonGroup>
        </Box>
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

      {/* Immagini */}
      <Box sx={{ gridArea: "images" }}>
        <ImagesField
          exerciseId={exercise.id}
          existing={exercise.images ?? []}
          newFiles={newImages}
          max={MAX_IMAGES}
          onAddFiles={onAddImages}
          onRemoveExisting={onRemoveExistingImage}
          onRemoveNew={onRemoveNewImage}
        />
      </Box>
    </Box>
  );
};

export default ExerciseForm;
