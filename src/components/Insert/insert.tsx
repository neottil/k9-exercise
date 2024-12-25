import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Snackbar
} from "@mui/material";
import { OnChangeCallback } from "../../interfaces/filterInterfaces";
import { Exercise, defaultExercise } from "../../interfaces/exerciseInterfaces";
import TypeSelect, {
  DEFAULT as TypeSelectDefaultValue,
} from "../filters/TypeSelect";
import { v4 as uuid } from "uuid";
import { isEmpty } from "../../functions/stringUtils";

interface Error {
  id: string;
  message: string;
}

// user.loginId
const Insert = (): React.ReactNode => {
  const [exerciseToSave, setExerciseToSave] =
    useState<Exercise>(defaultExercise);
  const [newType, setNewType] = useState<boolean>(false);
  const [saveAction, setSaveAction] = useState<boolean>(false);
  const [formError, setFormError] = useState<Error[]>([]);

  const validateRequiredFields = useCallback((): Error[] => {
    const error: Error[] = [];
    // type
    if (isEmpty(exerciseToSave.type)) {
      error.push({
        id: uuid(),
        message: "La tipologia di esercizio è obbligatoria.",
      });
    }
    return error;
  }, [exerciseToSave]);

  const validateForm = useCallback((): boolean => {
    const error: Error[] = validateRequiredFields();
    setFormError(error);
    console.log("Validation error: " + error);
    return error.length == 0;
  }, [validateRequiredFields]);

  useEffect(() => {
    if (saveAction) {
      const valid: boolean = validateForm();
      if (valid) {
        console.log("saving: ", exerciseToSave);
        setSaveAction(false);
      }
    }
  }, [saveAction, exerciseToSave, validateForm, validateRequiredFields]);

  const OnClickSave = () => {
    setExerciseToSave({ ...exerciseToSave, id: uuid() });
    setSaveAction(true);
  };

  const updateExerciseToSaveWithTarget = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    console.log("updateExerciseToSaveWithTarget");
    updateExerciseToSave(event.target.name, event.target.value);
  };

  const updateExerciseToSave: OnChangeCallback = (
    name: string,
    value: string
  ): void => {
    console.log("updateExerciseToSave -> " + name + ":" + value);
    setExerciseToSave({
      ...exerciseToSave,
      [name]: value,
    });
  };

  const onChangeIsNewSwitch = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setNewType(event.target.checked);
    setExerciseToSave({
      ...exerciseToSave,
      type: TypeSelectDefaultValue,
    });
  };

  const handleCloseSnackbar = (id: string) => {
    setFormError((prev) => prev.filter((error) => error.id !== id));
  };

  return (
    <Box sx={{ m: 1 }}>
      {formError.length > 0 &&
        formError.map((error) => (
          <Snackbar
            autoHideDuration={5000}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            open
            onClose={() => handleCloseSnackbar(error.id)}
            key={error.id}
          >
            <Alert
              onClose={() => handleCloseSnackbar(error.id)}
              severity="error"
            //variant="filled"
            //sx={{ width: "100%" }}
            >
              {error.message}
            </Alert>
          </Snackbar>
        ))}
      <Box display="flex" flexDirection="row">
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
          <FormControl fullWidth>
            <TextField
              label="Nuova Tipologia"
              name="type"
              value={(newType && exerciseToSave?.type) || TypeSelectDefaultValue}
              disabled={!newType}
              onChange={updateExerciseToSaveWithTarget}
            />
          </FormControl>
        )}
      </Box>
      <Box sx={{my: 2}}>
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
