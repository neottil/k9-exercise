import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  TextareaAutosize,
  Snackbar
} from "@mui/material";
import { v4 as uuid } from "uuid";
import { OnChangeCallback } from "../../interfaces/filterInterfaces";
import { Exercise, defaultExercise } from "../../interfaces/exerciseInterfaces";
import TypeSelect, {
  DEFAULT as TypeSelectDefaultValue,
} from "../filters/TypeSelect";
import { validate } from "./validationFunction";

// user.loginId
const Insert = (): React.ReactNode => {
  const [exerciseToSave, setExerciseToSave] =
    useState<Exercise>(defaultExercise);
  const [newType, setNewType] = useState<boolean>(false);
  const [saveAction, setSaveAction] = useState<boolean>(false);
  const [formError, setFormError] = useState<Error[]>([]);

  const validateForm = useCallback((): boolean => {
    const errors: Error[] = validate(exerciseToSave);
    setFormError(errors);

    errors.length !== 0 && console.error("Validation errors:\n", errors.reduce((acc, { name, message }) => {
      const errorLine = `Error ${name}: ${message}`;
      return acc ? `${acc}\n${errorLine}` : errorLine;
    }, ""));

    return errors.length == 0;
  }, [exerciseToSave]);

  useEffect(() => {
    if (saveAction) {
      const valid: boolean = validateForm();
      if (valid) {
        console.info("saving: ", exerciseToSave);
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
    setFormError((prev) => prev.filter((error) => error.name !== name));
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
      {formError.length > 0 &&
        formError.map((error) => (
          <Snackbar
            autoHideDuration={5000}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            open
            onClose={() => handleCloseSnackbar(error.name)}
            key={error.name}
          >
            <Alert
              onClose={() => handleCloseSnackbar(error.name)}
              severity="error"
            >
              {error.message}
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
