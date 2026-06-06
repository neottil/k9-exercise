import { useCallback, useEffect, useState, ChangeEvent, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router"
import { v4 as uuid } from "uuid";
import { debounce } from "lodash";
import {
  Box,
  Button,
  FormControlLabel,
  InputLabel,
  Switch,
  TextField,
} from "@mui/material";
import DataLoader from "../DataLoader";
import { StatBarsField, WORKING_AREA_LABELS, BODY_TARGET_LABELS } from "../StatBars";
import TypeSelect, {
  DEFAULT as TypeSelectDefaultValue,
} from "../TypeSelect";
import ArrayField from "../ArrayField";
import { Exercise, defaultExercise, movementPlans } from "../../interfaces/exerciseInterfaces";
import { capitalize } from "../../utils/stringUtils";
import { validate } from "./validationFunction";
import { createExercise as createExerciseApi, updateExercise as updateExerciseApi, getExercise as getExerciseApi } from "../../api/exercises";
import LevelSelect from "../LevelSelect";
import { deepCopy } from "../../utils/objectUtils";
import { useNotification } from "../../contexts/NotificationContext";

const Insert = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError, showErrors } = useNotification();

  const [exerciseToSave, setExerciseToSave] = useState<Exercise>(deepCopy(defaultExercise));
  const [newType, setNewType] = useState<boolean>(false);
  const [saveAction, setSaveAction] = useState<boolean>(false);
  // fetchLoading parte true solo in modalità modifica (id presente)
  const [fetchLoading, setFetchLoading] = useState<boolean>(!!id);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const setupInputRef = useRef<HTMLInputElement | null>(null);
  const variantInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id) return;
    setFetchLoading(true);
    setFetchError(null);
    getExerciseApi(id)
      .then((data) => setExerciseToSave(data))
      .catch((err) => {
        console.error("Errore nel recupero dell'esercizio", err);
        setFetchError("Impossibile caricare i dati dell'esercizio. Verifica la connessione e riprova.");
      })
      .finally(() => setFetchLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = useCallback(async (): Promise<boolean> => {
    try {
      if (id) {
        await updateExerciseApi(id, exerciseToSave);
      } else {
        await createExerciseApi(exerciseToSave);
      }
      showSuccess("Esercizio salvato correttamente");
      return true;
    } catch (err) {
      console.error("Errore nel salvataggio", err);
      showError("Errore imprevisto durante il salvataggio");
      return false;
    }
  }, [exerciseToSave, id, showSuccess, showError]);

  useEffect(() => {
    const handleSave = async () => {
      if (saveAction) {
        console.info("saving: ", exerciseToSave);
        setSaveAction(false);
        const isSaved = await save();
        if (isSaved) {
            setTimeout(() => navigate("/"), 1000);
        }
      }
    };
    handleSave();
  }, [saveAction, exerciseToSave, id, navigate, save]);

  const validateForm = useCallback((): boolean => {
    const errors: Error[] = validate(exerciseToSave);

    if (errors.length !== 0) {
      console.error("Validation errors:\n", errors.reduce((acc, { name, message }) => {
        const errorLine = `${name}: ${message}`;
        return acc ? `${acc}\n${errorLine}` : errorLine;
      }, ""));
      showErrors(errors.map((e) => e.message));
    }

    return errors.length === 0;
  }, [exerciseToSave, showErrors]);

  // useMemo is no longer needed for client but kept for id stability
  const finalizeExerciseToSave = useMemo(() => () => {
    setExerciseToSave((prev) => {
      const toSave = { ...prev };
      if (!toSave.id) {
        toSave.id = uuid();
      }
      return toSave;
    });
  }, []);

  const OnClickSave = () => {
    const valid: boolean = validateForm();
    if (valid) {
      finalizeExerciseToSave();
      setSaveAction(true);
    }
  };

  const updateExerciseToSave = (
    name: string,
    value: string | string[] | number
  ) => {
    setExerciseToSave(prevState => {
      const updatedState = { ...prevState };
      const keys = name.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let temp: any = updatedState;
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]];
      }
      temp[keys[keys.length - 1]] = value;
      return updatedState;
    });
  };

  const updateExerciseToSaveWithEvent = debounce((
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => updateExerciseToSave(event.target.name, capitalize(event.target.value)), 500);

  const onChangeIsNewSwitch = (event: ChangeEvent<HTMLInputElement>) => {
    setNewType(event.target.checked);
    updateExerciseToSave("type", TypeSelectDefaultValue);
  };

  const renderDifficultyAndType = (
    <>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", my: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", mr: 2 }}>
          <InputLabel required>Difficoltà</InputLabel>
          <LevelSelect
            value={exerciseToSave.difficultyLevel}
            label=""
            name="difficultyLevel"
            useZeroValue
            disableAdornment
            onChangeCallback={updateExerciseToSave}
          />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <InputLabel required>Tipologia</InputLabel>
          <Box sx={{ display: "flex", flexDirection: "row" }}>
            {!newType && (
              <TypeSelect
                onChangeCallback={updateExerciseToSave}
                value={(!newType && exerciseToSave?.type) || TypeSelectDefaultValue}
              />
            )}
            {newType && (
              <TextField
                fullWidth
                name="type"
                onChange={updateExerciseToSaveWithEvent}
              />
            )}
            <FormControlLabel
              label="Nuova"
              control={<Switch checked={newType} onChange={onChangeIsNewSwitch} />}
              sx={{ mx: 1 }}
            />
          </Box>
        </Box>
      </Box>
    </>
  );

  const renderVariant = (
    <Box sx={{ my: 1 }}>
      <InputLabel>Variante</InputLabel>
      <TextField
        inputRef={variantInputRef}
        defaultValue={exerciseToSave.variant}
        fullWidth
        name="variant"
        onChange={updateExerciseToSaveWithEvent}
        multiline
        maxRows={1}
      />
    </Box>
  );

  const renderDescription = (
    <Box sx={{ my: 1 }}>
      <InputLabel required>Descrizione</InputLabel>
      <TextField
        inputRef={descriptionInputRef}
        defaultValue={exerciseToSave.description}
        fullWidth
        name="description"
        onChange={updateExerciseToSaveWithEvent}
        multiline
        minRows={2}
      />
    </Box>
  );

  const renderTools = (
    <Box sx={{ my: 1 }}>
      <InputLabel>Attrezzi</InputLabel>
      <ArrayField
        name="tools"
        items={exerciseToSave.tools}
        onChange={updateExerciseToSave}
      />
    </Box>
  );

  const renderSetup = (
    <Box sx={{ my: 1 }}>
      <InputLabel required={exerciseToSave.tools.length > 0}>Setup</InputLabel>
      <TextField
        inputRef={setupInputRef}
        defaultValue={exerciseToSave.setup}
        fullWidth
        name="setup"
        onChange={updateExerciseToSaveWithEvent}
        multiline
        rows={2}
      />
    </Box>
  );

  const renderMovementPlan = (
    <Box sx={{ my: 1 }}>
      <InputLabel required>Piano di movimento</InputLabel>
      <ArrayField
        name="movementPlan"
        items={exerciseToSave.movementPlan}
        onChange={updateExerciseToSave}
        options={movementPlans}
      />
    </Box>
  );

  const renderWorkingArea = (
    <Box sx={{ my: 1 }}>
      <InputLabel required>Area target</InputLabel>
      <StatBarsField
        data={exerciseToSave.workingArea as unknown as Record<string, number>}
        labels={WORKING_AREA_LABELS}
        fieldPrefix="workingArea"
        onChange={updateExerciseToSave}
      />
    </Box>
  );

  const renderBodyTarget = (
    <Box sx={{ my: 1 }}>
      <InputLabel required>Body target</InputLabel>
      <StatBarsField
        data={exerciseToSave.bodyTarget as unknown as Record<string, number>}
        labels={BODY_TARGET_LABELS}
        fieldPrefix="bodyTarget"
        onChange={updateExerciseToSave}
      />
    </Box>
  );

  return (
    <DataLoader
      loading={fetchLoading}
      error={fetchError}
      onRetry={id ? () => {
        setFetchLoading(true);
        setFetchError(null);
        getExerciseApi(id)
          .then((data) => setExerciseToSave(data))
          .catch(() => setFetchError("Impossibile caricare i dati dell'esercizio."))
          .finally(() => setFetchLoading(false));
      } : undefined}
      minHeight={400}
    >
      <Box sx={{ m: 1 }}>
        {renderDifficultyAndType}
        {renderVariant}
        {renderDescription}
        {renderTools}
        {renderSetup}
        {renderMovementPlan}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {renderWorkingArea}
          {renderBodyTarget}
        </Box>
        <Box sx={{ my: 2 }}>
          <Button variant="contained" onClick={OnClickSave}>
            Salva
          </Button>
        </Box>
      </Box>
    </DataLoader>
  );
};

export default Insert;
