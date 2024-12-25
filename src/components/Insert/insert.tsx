import React, { useCallback, useEffect, useState } from "react";
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
import { v4 as uuid } from "uuid";
import { OnChangeCallback } from "../../interfaces/filterInterfaces";
import { Exercise, defaultExercise } from "../../interfaces/exerciseInterfaces";
import TypeSelect, {
  DEFAULT as TypeSelectDefaultValue,
} from "../filters/TypeSelect";
import { validate } from "./validationFunction";

enum ALERT_TYPE { ERROR = "error", INFO = "info" }
interface FormAlert extends Error {
  severity: ALERT_TYPE
}

// user.loginId
const Insert = (): React.ReactNode => {
  const [exerciseToSave, setExerciseToSave] =
    useState<Exercise>(defaultExercise);
  const [newType, setNewType] = useState<boolean>(false);
  const [saveAction, setSaveAction] = useState<boolean>(false);
  const [formAlert, setFormAlert] = useState<FormAlert[]>([]);

  const validateForm = useCallback((): boolean => {
    var errors: Error[] = validate(exerciseToSave);
    setFormAlert(errors.map(err => ({ ...err, severity: ALERT_TYPE.ERROR })));

    errors.length !== 0 && console.error("Validation errors:\n", errors.reduce((acc, { name, message }) => {
      const errorLine = `${name}: ${message}`;
      return acc ? `${acc}\n${errorLine}` : errorLine;
    }, ""));

    return errors.length == 0;
  }, [exerciseToSave]);

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


  useEffect(() => {
    if (saveAction) {
      const valid: boolean = validateForm();
      if (valid) {
        console.info("saving: ", exerciseToSave);
        setFormAlert([{ name: "Salvato", message: "Esercizio salvato correttamente", severity: ALERT_TYPE.INFO }]);
        setExerciseToSave(defaultExercise)
      }
      setSaveAction(false);
    }
  }, [saveAction, exerciseToSave, validateForm]);

  const OnClickSave = () => {
    setExerciseToSave({ ...exerciseToSave, id: uuid() });
    setSaveAction(true);
  };

  const updateExerciseToSave: OnChangeCallback = (
    name: string,
    value: string
  ) => {
    console.log("updateExerciseToSave -> " + name + ":" + value);
    setExerciseToSave({
      ...exerciseToSave,
      [name]: value,
    });
  };

  const updateExerciseToSaveWithEvent = (
    event: React.ChangeEvent<any>
  ): any => updateExerciseToSave(event.target.name, event.target.value);

  const onChangeIsNewSwitch = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
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
        />
      )}
      <FormControlLabel
        label="Nuova"
        control={
          <Switch checked={newType} onChange={onChangeIsNewSwitch} />
        }
        sx={{ mx: 1 }}
      />

      {newType && (
        <TextField
          fullWidth
          label="Nuova Tipologia"
          name="type"
          value={(newType && exerciseToSave?.type)}
          disabled={!newType}
          onChange={updateExerciseToSaveWithEvent}
        />
      )}
    </Box>
  );

  const renderDescription = (
    <Box sx={{ my: 1 }}>
      <TextField
        fullWidth
        label="Descrizione"
        name="description"
        value={exerciseToSave?.description}
        onChange={updateExerciseToSaveWithEvent}
        multiline
        rows={2}
      />
    </Box>
  );

  return (
    <Box sx={{ m: 1 }}>
      {formAlert.length > 0 &&
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
