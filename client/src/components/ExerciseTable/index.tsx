// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  GridColDef,
  GridAutosizeOptions,
  GridRowParams,
} from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

import { Exercise } from "../../interfaces/exerciseInterfaces";
import { useFilters } from "../../contexts/FiltersContext";
import {
  createTypeColumn,
  instructorLevel as instructorLevelCol,
  variant,
  description,
  tools,
  setup,
  workingAreas,
  bodyTargets,
  movementPlan,
  difficultyLevel,
} from "./columnsDef";

interface ExerciseTableProps {
  rows: Array<Exercise>;
  loading: boolean;
  error: boolean;
}

const StyledTableContainer = styled(Box)(({ theme }) => ({
  ["& .super-app-theme--header"]: {
    backgroundColor: theme.palette.primary.main,
  },
}));

// Colonne statiche — definite fuori dal componente, non ri-create ad ogni render.
// "type" (con bottone edit) è creata tramite factory in columnsDef.tsx.
const staticColumns: GridColDef[] = [
  instructorLevelCol,
  variant,
  description,
  tools,
  setup,
  workingAreas,
  bodyTargets,
  movementPlan,
  difficultyLevel,
];

const autosizeOptions: GridAutosizeOptions = { includeOutliers: true };

const ExerciseTable = ({ rows, loading, error }: ExerciseTableProps) => {
  const navigate = useNavigate();
  const { dataGridState, setDataGridFilterModel, setDataGridSortModel } = useFilters();

  // Riga selezionata: usata su touch per mostrare il bottone edit al tap
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Colonna "Tipologia" con bottone edit — definita in columnsDef.tsx tramite factory.
  const typeWithEdit = useMemo(() => createTypeColumn(navigate), [navigate]);

  const columns = useMemo(
    () => [typeWithEdit, ...staticColumns],
    [typeWithEdit]
  );

  const getRowHeight = useCallback(() => "auto", []);
  const getRowSpacing = useCallback(() => ({ top: 3, bottom: 3 }), []);

  // Tap su riga (mobile): seleziona/deseleziona → mostra/nasconde il bottone
  const onRowClick = useCallback((params: GridRowParams) => {
    setSelectedRowId((prev) =>
      prev === (params.id as string) ? null : (params.id as string)
    );
  }, []);

  return (
    <StyledTableContainer>
      <DataGrid
        slots={{
          noRowsOverlay: () => (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              {error ? "Errore nel caricamento dei dati" : "Nessun risultato"}
            </Box>
          ),
        }}
        rows={rows}
        columns={columns}
        autosizeOptions={autosizeOptions}
        getRowHeight={getRowHeight}
        getRowSpacing={getRowSpacing}
        scrollbarSize={0}
        filterModel={dataGridState.filterModel}
        onFilterModelChange={setDataGridFilterModel}
        sortModel={dataGridState.sortModel}
        onSortModelChange={setDataGridSortModel}
        rowSelectionModel={
          selectedRowId
            ? { type: "include" as const, ids: new Set([selectedRowId]) }
            : { type: "include" as const, ids: new Set<string>() }
        }
        onRowClick={onRowClick}
        loading={loading}
        sx={{
          // Bottone invisibile di default
          "& .MuiDataGrid-row .edit-action": {
            opacity: 0,
            transition: "opacity 150ms ease",
          },
          // Desktop: visibile sull'hover dell'intera riga
          "& .MuiDataGrid-row:hover .edit-action": {
            opacity: 1,
          },
          // Mobile/tablet: visibile sulla riga selezionata dal tap
          "& .MuiDataGrid-row.Mui-selected .edit-action": {
            opacity: 1,
          },
        }}
      />
    </StyledTableContainer>
  );
};

export default ExerciseTable;
