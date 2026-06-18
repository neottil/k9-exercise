// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useCallback, useEffect, useState } from "react";
import { Exercise } from "../../interfaces/exerciseInterfaces";
import { listExercises as fetchExercisesApi } from "../../api/exercises";
import { useFilters } from "../../contexts/FiltersContext";
import Box from "@mui/material/Box";

import WorkingAreaFilters from "../filters/WorkingAreaFilters";
import BodyTargetFilters from "../filters/BodyTargetFilters";
import ExerciseTable from "../ExerciseTable";
import DataLoader from "../DataLoader";

const View = () => {
  const { filters, updateFilter, resetFilter } = useFilters();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExercisesApi(filters);
      setExercises(data);
    } catch (err) {
      setError("Impossibile caricare gli esercizi.");
      console.error("Errore nel recupero degli esercizi", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Re-fetch ogni volta che i filtri cambiano; il backend esegue la query mirata
  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ mx: 1 }}>
      <Box sx={{ display: { xs: "block", md: "flex" }, my: 1 }}>
        <WorkingAreaFilters onChangeCallback={updateFilter} resetCallback={resetFilter} value={filters.workingArea} />
        <BodyTargetFilters onChangeCallback={updateFilter} resetCallback={resetFilter} value={filters.bodyTarget} />
      </Box>

      <DataLoader loading={loading} error={error} onRetry={load} minHeight={300}>
        <ExerciseTable rows={exercises} loading={false} error={false} />
      </DataLoader>
    </Box>
  );
};

export default View;
