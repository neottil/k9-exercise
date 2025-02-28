import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  GridColDef,
  GridAutosizeOptions,
  GridRowParams,
} from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

import type { Schema } from "../../../amplify/data/resource";
import {
  type,
  variant,
  description,
  tools,
  setup,
  workingAreas,
  bodyTargets,
  movementPlan,
  difficultyLevel
} from "./columnsDef";

interface ExerciseTableProps {
  rows: Array<Schema["Exercise"]["type"]>;
  loading: boolean;
  error: boolean;
}

const StyledTableContainer = styled(Box)(({ theme }) => ({
  ["& .super-app-theme--header"]: {
    backgroundColor: theme.palette.primary.main,
  },
}));

const columnsDef: GridColDef[] = [
  type,
  variant,
  description,
  tools,
  setup,
  workingAreas,
  bodyTargets,
  movementPlan,
  difficultyLevel
];

const autosizeOptions: GridAutosizeOptions = {
  includeOutliers: true,
};

const ExerciseTable = ({ rows, loading, error }: ExerciseTableProps) => {
  const navigate = useNavigate();

  const getRowHeight = useCallback(() => "auto", []);
  const getRowSpacing = useCallback(() => {
    return {
      top: 3,
      bottom: 3,
    };
  }, []);
  const onRowDoubleClick = useCallback((params: GridRowParams) =>  navigate(`/update/${params.id}`), [navigate]);
  
  return (
    <StyledTableContainer>
      <DataGrid
        slots={{
          noRowsOverlay: () => <Box sx={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%"}}>
              {error ? "Errore nel caricamento dei dati" : "Nessun risultato"}
              </Box>,
        }}
        rows={rows}
        columns={columnsDef}
        autosizeOptions={autosizeOptions}
        getRowHeight={getRowHeight}
        getRowSpacing={getRowSpacing}
        scrollbarSize={0}
        onRowDoubleClick={onRowDoubleClick}
        loading={loading}
      />
    </StyledTableContainer>
  );
};

export default ExerciseTable;
