import { useEffect, useState, type ChangeEvent } from "react";
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  InputLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { NewExercise } from "../../interfaces/adminInterfaces";
import type { Exercise } from "../../interfaces/exerciseInterfaces";
import { movementPlans } from "../../interfaces/exerciseInterfaces";
import { StatBarsField, WORKING_AREA_LABELS, BODY_TARGET_LABELS } from "../StatBars";
import TypeSelect, { DEFAULT as TypeSelectDefaultValue } from "../TypeSelect";
import ArrayField from "../ArrayField";
import LevelSelect from "../LevelSelect";
import { capitalize } from "../../utils/stringUtils";

interface NewExerciseDetailProps {
  exercise: NewExercise;
  onApprove: (exercise: Exercise) => void;
  onReject: () => void;
  loading: boolean;
}

const NewExerciseDetail = ({ exercise, onApprove, onReject, loading }: NewExerciseDetailProps) => {
  const [edited, setEdited] = useState<Exercise>({ ...exercise });
  const [newType, setNewType] = useState(false);

  useEffect(() => {
    setEdited({ ...exercise });
    setNewType(false);
  }, [exercise]);

  const update = (name: string, value: string | string[] | number) => {
    setEdited((prev) => {
      const next = { ...prev };
      const keys = name.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let temp: any = next;
      for (let i = 0; i < keys.length - 1; i++) temp = temp[keys[i]];
      temp[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateFromEvent = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    update(e.target.name, capitalize(e.target.value));
  };

  const formattedDate = exercise.createdAt
    ? new Date(exercise.createdAt).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Inserito da <strong>{exercise.user || "—"}</strong> il {formattedDate}
          </Typography>
        </Box>

        <Divider />

        {/* Tipologia e difficoltà */}
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <InputLabel required>Difficoltà</InputLabel>
            <LevelSelect
              value={edited.difficultyLevel}
              label=""
              name="difficultyLevel"
              useZeroValue
              disableAdornment
              onChangeCallback={update}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <InputLabel required>Tipologia</InputLabel>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              {!newType && (
                <TypeSelect
                  onChangeCallback={update}
                  value={edited.type || TypeSelectDefaultValue}
                />
              )}
              {newType && (
                <TextField
                  fullWidth
                  name="type"
                  value={edited.type}
                  onChange={updateFromEvent}
                />
              )}
              <FormControlLabel
                label="Nuova"
                control={
                  <Switch
                    checked={newType}
                    onChange={(e) => {
                      setNewType(e.target.checked);
                      update("type", TypeSelectDefaultValue);
                    }}
                  />
                }
                sx={{ mx: 1 }}
              />
            </Box>
          </Box>
        </Box>

        {/* Variante */}
        <Box>
          <InputLabel>Variante</InputLabel>
          <TextField
            fullWidth
            name="variant"
            value={edited.variant ?? ""}
            onChange={updateFromEvent}
          />
        </Box>

        {/* Descrizione */}
        <Box>
          <InputLabel required>Descrizione</InputLabel>
          <TextField
            fullWidth
            name="description"
            value={edited.description ?? ""}
            onChange={updateFromEvent}
            multiline
            minRows={2}
          />
        </Box>

        {/* Attrezzi */}
        <Box>
          <InputLabel>Attrezzi</InputLabel>
          <ArrayField
            name="tools"
            items={edited.tools ?? []}
            onChange={update}
          />
        </Box>

        {/* Setup */}
        <Box>
          <InputLabel>Setup</InputLabel>
          <TextField
            fullWidth
            name="setup"
            value={edited.setup ?? ""}
            onChange={updateFromEvent}
            multiline
            rows={2}
          />
        </Box>

        {/* Piano di movimento */}
        <Box>
          <InputLabel required>Piano di movimento</InputLabel>
          <ArrayField
            name="movementPlan"
            items={edited.movementPlan ?? []}
            onChange={update}
            options={movementPlans}
          />
        </Box>

        {/* Area target + Body target */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <Box>
            <InputLabel required>Area target</InputLabel>
            <StatBarsField
              data={edited.workingArea as unknown as Record<string, number>}
              labels={WORKING_AREA_LABELS}
              fieldPrefix="workingArea"
              onChange={update}
            />
          </Box>
          <Box>
            <InputLabel required>Body target</InputLabel>
            <StatBarsField
              data={edited.bodyTarget as unknown as Record<string, number>}
              labels={BODY_TARGET_LABELS}
              fieldPrefix="bodyTarget"
              onChange={update}
            />
          </Box>
        </Box>

      </Box>

      {/* Bottoni fissi */}
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
          onClick={() => onApprove(edited)}
          disabled={loading}
        >
          Approva
        </Button>
      </Box>

    </Box>
  );
};

export default NewExerciseDetail;
