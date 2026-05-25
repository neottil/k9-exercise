import { useCallback, useEffect, useState } from "react";
import { Exercise } from "../../interfaces/exerciseInterfaces";
import {
  NumberWithOperationOnChangeCallback,
  Filters,
  NumFilterWithOp,
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
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [filters, setFilters] = useState<Filters>(deepCopy(defaultFilters));
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isLoadingError, setLoadingError] = useState<boolean>(false);

  const fetchExercise = async () => {
    try {
      const data = await fetchExercisesApi();
      setExercises(data);
    } catch (err) {
      setLoadingError(true);
      console.error("Errore nel recupero degli esercizi", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercise();
  }, []);

  const applyNumericFilter = (
    filter: NumFilterWithOp,
    exerciseValue: number | null | undefined
  ) =>
    !filter.value ||
    exerciseValue == undefined ||
    (filter.operation === "eq" && exerciseValue == filter.value) ||
    (filter.operation === "gt" && exerciseValue >= filter.value);

  const workingAreaMentalFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.workingArea.mental, exercise.workingArea?.mental),
    [filters.workingArea.mental]
  );
  const workingAreaFlexFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.workingArea.flexibility, exercise.workingArea?.flexibility),
    [filters.workingArea.flexibility]
  );
  const workingAreaStrengthFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.workingArea.strength, exercise.workingArea?.strength),
    [filters.workingArea.strength]
  );
  const workingAreaBalanceFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.workingArea.balance, exercise.workingArea?.balance),
    [filters.workingArea.balance]
  );
  const workingAreaCardioFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.workingArea.cardio, exercise.workingArea?.cardio),
    [filters.workingArea.cardio]
  );

  const bodyTargetAntFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.bodyTarget.ant, exercise.bodyTarget?.ant),
    [filters.bodyTarget.ant]
  );
  const bodyTargetPostFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.bodyTarget.post, exercise.bodyTarget?.post),
    [filters.bodyTarget.post]
  );
  const bodyTargetCoreFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.bodyTarget.core, exercise.bodyTarget?.core),
    [filters.bodyTarget.core]
  );
  const bodyTargetBackboneFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.bodyTarget.backbone, exercise.bodyTarget?.backbone),
    [filters.bodyTarget.backbone]
  );
  const bodyTargetFullbodyFilter = useCallback(
    (exercise: Exercise) =>
      applyNumericFilter(filters.bodyTarget.fullBody, exercise.bodyTarget?.fullBody),
    [filters.bodyTarget.fullBody]
  );

  useEffect(() => {
    const filteredData = exercises
      .filter(workingAreaMentalFilter)
      .filter(workingAreaFlexFilter)
      .filter(workingAreaStrengthFilter)
      .filter(workingAreaBalanceFilter)
      .filter(workingAreaCardioFilter)
      .filter(bodyTargetAntFilter)
      .filter(bodyTargetPostFilter)
      .filter(bodyTargetCoreFilter)
      .filter(bodyTargetBackboneFilter)
      .filter(bodyTargetFullbodyFilter);

    setFilteredExercises(filteredData);
  }, [
    bodyTargetAntFilter,
    bodyTargetBackboneFilter,
    bodyTargetCoreFilter,
    bodyTargetFullbodyFilter,
    bodyTargetPostFilter,
    exercises,
    filters,
    workingAreaBalanceFilter,
    workingAreaCardioFilter,
    workingAreaFlexFilter,
    workingAreaMentalFilter,
    workingAreaStrengthFilter,
  ]);

  const updateFilter: NumberWithOperationOnChangeCallback = useCallback((
    name,
    value,
    operation
  ) => {
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
      <ExerciseTable rows={filteredExercises} loading={isLoading} error={isLoadingError}/>
    </Box>
  );
};

export default View;
