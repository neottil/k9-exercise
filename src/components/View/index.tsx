import { useEffect, useState } from "react";
import { Exercise } from "../../interfaces/exerciseInterfaces";
import { listExercises as fetchExercisesApi } from "../../api/exercises";
import { useFilters } from "../../contexts/FiltersContext";
import Box from "@mui/material/Box";

import WorkingAreaFilters from "../filters/WorkingAreaFilters";
import BodyTargetFilters from "../filters/BodyTargetFilters";
import ExerciseTable from "../ExerciseTable";

const View = () => {
  const { filters, updateFilter, resetFilter } = useFilters();

  const [exercises, setExercises] = useState<Exercise[]>([]);
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
