import { useCallback, useEffect, useState } from "react";
import { Exercise } from "../../interfaces/exerciseInterfaces";
import {
  NumberWithOperationOnChangeCallback,
  Filters,
  defaultFilters,
  ResetCallBack
} from "../../interfaces/filterInterfaces";
import { listExercises as fetchExercisesApi } from "../../api/exercises";
import Box from "@mui/material/Box";

import WorkingAreaFilters from "../filters/WorkingAreaFilters";
import BodyTargetFilters from "../filters/BodyTargetFilters";
import ExerciseTable from "../ExerciseTable";
import { deepCopy } from "../../utils/objectUtils";

const View = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filters, setFilters] = useState<Filters>(deepCopy(defaultFilters));
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isLoadingError, setLoadingError] = useState<boolean>(false);

  // Re-fetch ogni volta che i filtri cambiano; il backend esegue la query mirata
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      setLoadingError(false);
      try {
        const data = await fetchExercisesApi(filters);
        setExercises(data);
      } catch (err) {
        setLoadingError(true);
        console.error("Errore nel recupero degli esercizi", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [filters]);

  const updateFilter: NumberWithOperationOnChangeCallback = useCallback((name, value, operation) => {
    setFilters(prevState => {
      const updatedState = { ...prevState };
      const keys = name.split(".");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let temp: any = updatedState;
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]];
      }
      temp[keys[keys.length - 1]] = { value, operation };

      return updatedState;
    });
  }, []);

  const resetFilter: ResetCallBack = useCallback((name) => {
    const keys = name.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let defaultValue: any = defaultFilters;
    for (let i = 0; i < keys.length; i++) {
      defaultValue = defaultValue[keys[i]];
    }
    updateFilter(name, defaultValue.value, defaultValue.operation);
  }, [updateFilter]);

  return (
    <Box sx={{ mx: 1 }}>
      <Box sx={{ display: { xs: "block", md: "flex" }, my: 1 }}>
        <WorkingAreaFilters onChangeCallback={updateFilter} resetCallback={resetFilter} value={filters.workingArea} />
        <BodyTargetFilters onChangeCallback={updateFilter} resetCallback={resetFilter} value={filters.bodyTarget} />
      </Box>
      <ExerciseTable rows={exercises} loading={isLoading} error={isLoadingError} />
    </Box>
  );
};

export default View;
