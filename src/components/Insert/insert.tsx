import React, { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { generateClient } from "aws-amplify/api";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Snackbar
} from "@mui/material";
import TypeSelect, {
  DEFAULT as TypeSelectDefaultValue,
} from "../TypeSelect";
import ArrayField from "../ArrayField";
import { OutletRouterContext } from "../../interfaces/outletRouterContext";
import { Exercise, defaultExercise, movementPlans } from "../../interfaces/exerciseInterfaces";
import { capitalize } from "../../utils/stringUtils";
import { validate } from "./validationFunction";
import { createExercise } from "./mutations";
import LevelSelect from "../LevelSelect";
import { deepCopy } from "../../utils/objectUtils";

enum ALERT_TYPE { ERROR = "error", INFO = "info" }
interface FormAlert extends Error {
  severity: ALERT_TYPE
}

const Insert = (): React.ReactNode => {
  const [exerciseToSave, setExerciseToSave] = useState<Exercise>(deepCopy(defaultExercise));
  const [newType, setNewType] = useState<boolean>(false);
  const [saveAction, setSaveAction] = useState<boolean>(false);
  const [formAlert, setFormAlert] = useState<FormAlert[]>([]);
  const { user } = useOutletContext<OutletRouterContext>();

  const client = generateClient();

  const save = async (): Promise<boolean> => {
    try {
      await client.graphql({
        query: createExercise,
        variables: {
          input: {
            ...exerciseToSave,
          },
        },
      });
      return true;
    } catch (err: any) {
      console.error("Unexpected error", err);
      if (err.errors && Array.isArray(err.errors)) {
        setFormAlert(err.errors.map((e: { message: string; }) => ({ name: "Saving error", message: e.message, severity: ALERT_TYPE.ERROR })));
      } else {
        setFormAlert([{ name: "Unexpected error", message: "Unexpected error during saving action", severity: ALERT_TYPE.ERROR }]);
      }
      return false;
    }
  };

  const validateForm = useCallback((): boolean => {
    var errors: Error[] = validate(exerciseToSave);
    setFormAlert(errors.map(err => ({ ...err, severity: ALERT_TYPE.ERROR })));

    errors.length !== 0 && console.error("Validation errors:\n", errors.reduce((acc, { name, message }) => {
      const errorLine = `${name}: ${message}`;
      return acc ? `${acc}\n${errorLine}` : errorLine;
    }, ""));

    return errors.length == 0;
  }, [exerciseToSave]);

  const finalizeExerciseToSave = () => {
    setExerciseToSave((prev) => {
      const toSave = { ...prev };
      if (!toSave.id) {
        toSave.id = uuid();
      }
      if (!toSave.user) {
        toSave.user = user.signInDetails?.loginId;
      }
      return toSave;
    })
  };


  // Manage automatic closure after 5 seconds for each alert
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    formAlert.forEach((alert) => {
      const timer = setTimeout(() => {
        handleCloseSnackbar(alert.name);
      }, 4000);
      timers.push(timer);
    });

    // Clean the timers when the component disassembles or when the alert array changes
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [formAlert]);

  const handleSave = async () => {
    if (saveAction) {
      console.info("saving: ", exerciseToSave);
      try {
        setSaveAction(false);
        const isSaved = await save();
        if (isSaved) {
          setFormAlert([{ name: "Salvato", message: "Esercizio salvato correttamente", severity: ALERT_TYPE.INFO }]);
          setExerciseToSave(deepCopy(defaultExercise));
          setNewType(false);
        }
      } catch (e) {

      }
    }
  };

  useEffect(() => {
    handleSave();
  }, [saveAction, exerciseToSave, validateForm]);

  const OnClickSave = () => {
    const valid: boolean = validateForm();
    if (valid) {
      finalizeExerciseToSave()
      setSaveAction(true);
    }
  };

  const updateExerciseToSave = (
    name: string,
    value: string | string[] | number
  ) => {
    console.log("updateExerciseToSave -> " + name + ":" + value);
    setExerciseToSave(prevState => {
      const updatedState = { ...prevState };
      const keys = name.split('.'); // Usa il punto come delimitatore per separare il percorso

      let temp: any = updatedState;
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]]; // Naviga fino al penultimo livello
      }

      temp[keys[keys.length - 1]] = value; // Aggiorna il campo finale

      return updatedState;
    });
  };

  const updateExerciseToSaveWithEvent = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => updateExerciseToSave(event.target.name, capitalize(event.target.value));

  const onChangeIsNewSwitch = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewType(event.target.checked);
    setExerciseToSave({
      ...exerciseToSave,
      type: TypeSelectDefaultValue,
    });
  };

  const handleCloseSnackbar = (name: string) => {
    setFormAlert((prev) => prev.filter((error) => error.name !== name));
  };

  const renderType = (
    <Box display="flex" flexDirection="row" sx={{ my: 1 }}>
      {!newType && (
        <TypeSelect
          onChangeCallback={updateExerciseToSave}
          disabled={newType}
          value={(!newType && exerciseToSave?.type) || TypeSelectDefaultValue}
          required
        />
      )}
      {newType && (
        <TextField
          required
          fullWidth
          label="Nuova Tipologia"
          name="type"
          value={(newType && exerciseToSave?.type)}
          disabled={!newType}
          onChange={updateExerciseToSaveWithEvent}
        />
      )}
      <FormControlLabel
        label="Nuova"
        control={
          <Switch checked={newType} onChange={onChangeIsNewSwitch} />
        }
        sx={{ mx: 1 }}
      />
    </Box>
  );

  const renderDescription = (
    <Box sx={{ my: 1 }}>
      <TextField
        required
        fullWidth
        label="Descrizione"
        name="description"
        value={exerciseToSave?.description}
        onChange={updateExerciseToSaveWithEvent}
        multiline
        minRows={2}
      />
    </Box>
  );

  const renderTools = (
    <Box sx={{ my: 1 }}>
      <ArrayField
        label="Attrezzi"
        name="tools"
        items={exerciseToSave.tools}
        onChange={updateExerciseToSave}
      />
    </Box>
  );

  const renderSetup = (
    <Box sx={{ my: 1 }}>
      <TextField
        required
        fullWidth
        label="Setup"
        name="setup"
        value={exerciseToSave?.setup}
        onChange={updateExerciseToSaveWithEvent}
        multiline
        rows={2}
      />
    </Box>
  );

  const renderMovementPlan = (
    <Box sx={{ my: 1 }}>
      <ArrayField
        required
        label="Piano di movimento"
        name="movementPlan"
        items={exerciseToSave.movementPlan}
        onChange={updateExerciseToSave}
        options={movementPlans}
      />
    </Box>
  );

  const renderWorkingArea = (
    <Box component="fieldset" sx={{ my: 1 }} display="flex" justifyContent="space-between" gap={2}>
      <legend>Area target</legend>
      <LevelSelect
        value={exerciseToSave.workingArea.mental}
        label="Mentale"
        name="workingArea.mental"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
      <LevelSelect
        value={exerciseToSave.workingArea.flexibility}
        label="Flessibilità"
        name="workingArea.flexibility"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
      <LevelSelect
        value={exerciseToSave.workingArea.strength}
        label="Forza"
        name="workingArea.strength"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
      <LevelSelect
        value={exerciseToSave.workingArea.balance}
        label="Equilibrio"
        name="workingArea.balance"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
      <LevelSelect
        value={exerciseToSave.workingArea.cardio}
        label="Cardio"
        name="workingArea.cardio"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
    </Box>
  );

  const renderBodyTarget = (
    <Box component="fieldset" sx={{ my: 1 }} display="flex" justifyContent="space-between" gap={2}>
      <legend>Body target</legend>
      <LevelSelect
        value={exerciseToSave.bodyTarget.ant}
        label="Anteriore"
        name="bodyTarget.ant"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
      <LevelSelect
        value={exerciseToSave.bodyTarget.post}
        label="Posteriore"
        name="bodyTarget.post"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
      <LevelSelect
        value={exerciseToSave.bodyTarget.core}
        label="Core"
        name="bodyTarget.core"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
      <LevelSelect
        value={exerciseToSave.bodyTarget.backbone}
        label="Colonna"
        name="bodyTarget.backbone"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
      <LevelSelect
        value={exerciseToSave.bodyTarget.fullBody}
        label="Fullbody"
        name="bodyTarget.fullBody"
        useZeroValue
        disableAdornment
        onChangeCallback={updateExerciseToSave}
      />
    </Box>
  );

  return (
    <Box sx={{ m: 1 }}>
      {!!formAlert.length &&
        formAlert.map((alert, index) => (
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            open
            key={alert.name}
            sx={{
              marginTop: index * 10, // Aggiunge un margine verticale tra i messaggi
            }}
          >
            <Alert
              onClose={() => handleCloseSnackbar(alert.name)}
              severity={alert.severity}
            >
              <AlertTitle>{alert.name}</AlertTitle>
              {alert.message}
            </Alert>
          </Snackbar>
        ))}
      {renderType}
      {renderDescription}
      {renderTools}
      {renderSetup}
      {renderMovementPlan}
      {renderWorkingArea}
      {renderBodyTarget}
      <Box sx={{ my: 2 }}>
        <Button
          variant="contained"
          onClick={OnClickSave}
        >
          Salva
        </Button>
      </Box>
    </Box>
  );
};

export default Insert;
