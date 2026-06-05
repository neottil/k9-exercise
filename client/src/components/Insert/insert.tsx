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
  const [exerciseToSave, setExerciseToSave] = useState<Exercise>(deepCopy(defaultExercise));
  const [newType, setNewType] = useState<boolean>(false);
  const [saveAction, setSaveAction] = useState<boolean>(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError, showErrors } = useNotification();

  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const setupInputRef = useRef<HTMLInputElement | null>(null);
  const variantInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      if (id) {
        try {
          const data = await getExerciseApi(id);
          setExerciseToSave(data);
        } catch (err) {
          console.error("Errore nel recupero dell'esercizio", err);
          showError(`Recupero esercizio fallito (id: ${id})`);
        }
      }
    };
    fetchExercise();
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
    <Box component="fieldset" sx={{ my: 1, display: "flex", justifyContent: "space-between", gap: 2 }}>
      <InputLabel component="legend" required>Area target</InputLabel>
      <LevelSelect value={exerciseToSave.workingArea.mental} label="Mentale" name="workingArea.mental" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
      <LevelSelect value={exerciseToSave.workingArea.flexibility} label="Flessibilità" name="workingArea.flexibility" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
      <LevelSelect value={exerciseToSave.workingArea.strength} label="Forza" name="workingArea.strength" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
      <LevelSelect value={exerciseToSave.workingArea.balance} label="Equilibrio" name="workingArea.balance" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
      <LevelSelect value={exerciseToSave.workingArea.cardio} label="Cardio" name="workingArea.cardio" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
    </Box>
  );

  const renderBodyTarget = (
    <Box component="fieldset" sx={{ my: 1, display: "flex", justifyContent: "space-between", gap: 2 }}>
      <InputLabel component="legend" required>Body target</InputLabel>
      <LevelSelect value={exerciseToSave.bodyTarget.ant} label="Anteriore" name="bodyTarget.ant" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
      <LevelSelect value={exerciseToSave.bodyTarget.post} label="Posteriore" name="bodyTarget.post" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
      <LevelSelect value={exerciseToSave.bodyTarget.core} label="Core" name="bodyTarget.core" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
      <LevelSelect value={exerciseToSave.bodyTarget.backbone} label="Colonna" name="bodyTarget.backbone" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
      <LevelSelect value={exerciseToSave.bodyTarget.fullBody} label="Fullbody" name="bodyTarget.fullBody" useZeroValue disableAdornment onChangeCallback={updateExerciseToSave} />
    </Box>
  );

  return (
    <Box sx={{ m: 1 }}>
      {renderDifficultyAndType}
      {renderVariant}
      {renderDescription}
      {renderTools}
      {renderSetup}
      {renderMovementPlan}
      {renderWorkingArea}
      {renderBodyTarget}
      <Box sx={{ my: 2 }}>
        <Button variant="contained" onClick={OnClickSave}>
          Salva
        </Button>
      </Box>
    </Box>
  );
};

export default Insert;
