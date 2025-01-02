import { useCallback } from "react";
import {
  DataGrid,
  GridColDef,
  GridAutosizeOptions,
} from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

import type { Schema } from "../../../amplify/data/resource";
import {
  type,
  description,
  tools,
  setup,
  workingAreas,
  bodyTargets,
  movementPlan,
} from "./columnsDef";

interface ExerciseTableProps {
  rows: Array<Schema["Exercise"]["type"]>;
}

const StyledTableContainer = styled(Box)(({ theme }) => ({
  ["& .super-app-theme--header"]: {
    backgroundColor: theme.palette.primary.main,
  },
}));

const columnsDef: GridColDef[] = [
  type,
  description,
  tools,
  setup,
  workingAreas,
  bodyTargets,
  movementPlan,
];

const autosizeOptions: GridAutosizeOptions = {
  includeOutliers: true,
};

const ExerciseTable = ({ rows }: ExerciseTableProps) => {
  const getRowSpacing = useCallback(() => {
    return {
      top: 3,
      bottom: 3,
    };
  }, []);
  
  return (
    <StyledTableContainer>
      <DataGrid
        rows={rows}
        columns={columnsDef}
        getRowHeight={() => "auto"}
        autosizeOptions={autosizeOptions}
        getRowSpacing={getRowSpacing}
        scrollbarSize={0}
      />
    </StyledTableContainer>
  );};

export default ExerciseTable;
