import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { v4 as uuid } from "uuid";
import { Box, Button } from "@mui/material";
import DataLoader from "../DataLoader";
import { Exercise, defaultExercise } from "../../interfaces/exerciseInterfaces";
import { validate } from "./validationFunction";
import { createExercise as createExerciseApi, updateExercise as updateExerciseApi, getExercise as getExerciseApi } from "../../api/exercises";
import { deepCopy } from "../../utils/objectUtils";
import { useNotification } from "../../contexts/NotificationContext";
import ExerciseForm from "./ExerciseForm";

const Insert = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError, showErrors } = useNotification();

  const [exerciseToSave, setExerciseToSave] = useState<Exercise>(deepCopy(defaultExercise));
  const [saveAction, setSaveAction] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(!!id);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  const updateExerciseToSave = useCallback((name: string, value: string | string[] | number) => {
    setExerciseToSave((prevState) => {
      const updatedState = { ...prevState };
      const keys = name.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let temp: any = updatedState;
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]];
      }
      temp[keys[keys.length - 1]] = value;
      return updatedState;
    });
  }, []);

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

  const finalizeExerciseToSave = useMemo(() => () => {
    setExerciseToSave((prev) => {
      const toSave = { ...prev };
      if (!toSave.id) toSave.id = uuid();
      return toSave;
    });
  }, []);

  const OnClickSave = () => {
    if (validateForm()) {
      finalizeExerciseToSave();
      setSaveAction(true);
    }
  };

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
        <ExerciseForm exercise={exerciseToSave} onChange={updateExerciseToSave} />
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
