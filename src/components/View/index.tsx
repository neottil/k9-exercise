import { useCallback, useEffect, useState } from "react";
import {
  NumberWithOperationOnChangeCallback,
  Filters,
  NumFilterWithOp,
  defaultFilters,
  ResetCallBack,
} from "../../interfaces/filterInterfaces";
import { generateClient } from "aws-amplify/data";
import Box from "@mui/material/Box";

import WorkingAreaFilters from "../filters/WorkingAreaFilters";
import BodyTargetFilters from "../filters/BodyTargetFilters";
import ExerciseTable from "../ExerciseTable";
import type { Schema } from "../../../amplify/data/resource";
import { deepCopy } from "../../utils/objectUtils";

const client = generateClient<Schema>();

const View = () => {
  const [exercises, setExercises] = useState<Array<Schema["Exercise"]["type"]>>([]);
  const [filteredExercises, setFilteredExercises] = useState<Array<Schema["Exercise"]["type"]>>([]);
  const [filters, setFilters] = useState<Filters>(deepCopy(defaultFilters));

  useEffect(() => {
    client.models.Exercise.observeQuery().subscribe({
      next: (data) => {
        setExercises([...data.items]);
      },
    });
  }, []);

  const applyNumericFilter = (
    filter: NumFilterWithOp,
    exerciseValue: number | null | undefined
  ) =>
    !filter.value || // if value is undefined return true (not apply filter) to data
    exerciseValue == undefined || // if exerciseValue is null return true (not apply filter) to data
    (filter.operation === "eq" && exerciseValue == filter.value) || // if operation is lt then apply filter
    (filter.operation === "gt" && exerciseValue >= filter.value); // if operation is gt then apply filter

  const workingAreaMentalFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters.workingArea.mental,
        exercise.workingArea?.mental
      ),
    [filters.workingArea.mental]
  );
  const workingAreaFlexFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters.workingArea.flexibility,
        exercise.workingArea?.flexibility
      ),
    [filters.workingArea.flexibility]
  );
  const workingAreaStrengthFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters.workingArea.strength,
        exercise.workingArea?.strength
      ),
    [filters.workingArea.strength]
  );
  const workingAreaBalanceFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters.workingArea.balance,
        exercise.workingArea?.balance
      ),
    [filters.workingArea.balance]
  );
  const workingAreaCardioFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters.workingArea.cardio,
        exercise.workingArea?.cardio
      ),
    [filters.workingArea.cardio]
  );

  const bodyTargetAntFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(filters.bodyTarget.ant, exercise.bodyTarget?.ant),
    [filters.bodyTarget.ant]
  );
  const bodyTargetPostFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(filters.bodyTarget.post, exercise.bodyTarget?.post),
    [filters.bodyTarget.post]
  );
  const bodyTargetCoreFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(filters.bodyTarget.core, exercise.bodyTarget?.core),
    [filters.bodyTarget.core]
  );
  const bodyTargetBackboneFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters.bodyTarget.backbone,
        exercise.bodyTarget?.backbone
      ),
    [filters.bodyTarget.backbone]
  );
  const bodyTargetFullbodyFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters.bodyTarget.fullBody,
        exercise.bodyTarget?.fullBody
      ),
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

      let temp: any = updatedState;
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]]; // Naviga fino al penultimo livello
      }

      temp[keys[keys.length - 1]] = { value, operation }; // Aggiorna il campo finale{ value, operation };

      return updatedState;
    });
  }, []);

  const resetFilter: ResetCallBack = useCallback((name) => {
    // Ottieni il valore di default dal percorso
    const keys = name.split("."); // Divide il percorso (es. "workingArea.mental") in chiavi
    let defaultValue: any = defaultFilters;
    for (let i = 0; i < keys.length; i++) {
      defaultValue = defaultValue[keys[i]];
    }
    // Utilizza la funzione updateFilterState per aggiornare lo stato con il valore di default
    updateFilter(name, defaultValue.value, defaultValue.operation);
  }, []);

  return (
    <Box sx={{ mx: 1 }}>
      <Box sx={{ display: { xs: "block", md: "flex" }, my: 1 }}>
        <WorkingAreaFilters onChangeCallback={updateFilter} resetCallback={resetFilter} value={filters.workingArea} />
        <BodyTargetFilters onChangeCallback={updateFilter} resetCallback={resetFilter} value={filters.bodyTarget} />
      </Box>
      <ExerciseTable rows={filteredExercises} />
    </Box>
  );
};

export default View;
