import { useCallback, useEffect, useState } from "react";
import { OnChangeCallback, Filters, NumFilter } from "../filters/interface";
import { generateClient } from "aws-amplify/data";
import Box from "@mui/material/Box";

import WorkingAreaFilters from "../filters/WorkingAreaFilters";
import BodyTargetFilters from "../filters/BodyTargetFilters";
import ExerciseTable from "../ExerciseTable";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

const View = () => {
  const [exercises, setExercises] = useState<Array<Schema["Exercise"]["type"]>>(
    []
  );
  const [filteredExercises, setFilteredExercises] = useState<
    Array<Schema["Exercise"]["type"]>
  >([]);
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    client.models.Exercise.observeQuery().subscribe({
      next: (data) => {
        setExercises([...data.items]);
      },
    });
  }, []);

  const applyNumericFilter = (
    filter: undefined | NumFilter,
    exerciseValue: undefined | null | number
  ) =>
    !filter?.value || // if value is undefined return true (not apply filter) to data
    exerciseValue == undefined || // if exerciseValue is null return true (not apply filter) to data
    (filter.operation === "eq" && exerciseValue == filter.value) || // if operation is lt then apply filter
    (filter.operation === "gt" && exerciseValue >= filter.value); // if operation is gt then apply filter

  const workingAreaMentalFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters?.workingArea?.mental,
        exercise?.workingArea?.mental
      ),
    [filters?.workingArea?.mental]
  );
  const workingAreaFlexFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters?.workingArea?.flexibility,
        exercise?.workingArea?.flexibility
      ),
    [filters?.workingArea?.flexibility]
  );
  const workingAreaStrengthFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters?.workingArea?.strength,
        exercise?.workingArea?.strength
      ),
    [filters?.workingArea?.strength]
  );
  const workingAreaBalanceFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters?.workingArea?.balance,
        exercise?.workingArea?.balance
      ),
    [filters?.workingArea?.balance]
  );
  const workingAreaCardioFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters?.workingArea?.cardio,
        exercise?.workingArea?.cardio
      ),
    [filters?.workingArea?.cardio]
  );

  const bodyTargetAntFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(filters?.bodyTarget?.ant, exercise?.bodyTarget?.ant),
    [filters?.bodyTarget?.ant]
  );
  const bodyTargetPostFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(filters?.bodyTarget?.post, exercise?.bodyTarget?.post),
    [filters?.bodyTarget?.post]
  );
  const bodyTargetCoreFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(filters?.bodyTarget?.core, exercise?.bodyTarget?.core),
    [filters?.bodyTarget?.core]
  );
  const bodyTargetBackboneFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters?.bodyTarget?.backbone,
        exercise?.bodyTarget?.backbone
      ),
    [filters?.bodyTarget?.backbone]
  );
  const bodyTargetFullbodyFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      applyNumericFilter(
        filters?.bodyTarget?.fullbody,
        exercise?.bodyTarget?.fullBody
      ),
    [filters?.bodyTarget?.fullbody]
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

  const onChangeWorkingAreaFilter: OnChangeCallback = (
    name: string,
    value: string,
    operation: string
  ) => {
    setFilters({
      ...filters,
      workingArea: { ...filters.workingArea, [name]: { value, operation } },
    });
  };

  const onChangeBodyTargetFilter: OnChangeCallback = (
    name: string,
    value: string,
    operation: string
  ) => {
    setFilters({
      ...filters,
      bodyTarget: { ...filters.bodyTarget, [name]: { value, operation } },
    });
  };

  return (
    <Box sx={{ m: "0.7em" }}>
      <Box sx={{ display: { xs: "block", md: "flex" } }}>
        <WorkingAreaFilters onChangeCallback={onChangeWorkingAreaFilter} />
        <BodyTargetFilters onChangeCallback={onChangeBodyTargetFilter} />
      </Box>
      <ExerciseTable rows={filteredExercises} />
    </Box>
  );
};

export default View;
