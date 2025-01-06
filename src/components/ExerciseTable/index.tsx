import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  GridColDef,
  GridAutosizeOptions,
  GridRowSelectionModel,
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
  const navigate = useNavigate();

  const getRowHeight = useCallback(() => "auto", []);
  const getRowSpacing = useCallback(() => {
    return {
      top: 3,
      bottom: 3,
    };
  }, []);
  const onRowSelectionModelChange = useCallback((id: GridRowSelectionModel) =>  navigate(`/update/${id}`), []);
  return (
    <StyledTableContainer>
      <DataGrid
        rows={rows}
        columns={columnsDef}
        autosizeOptions={autosizeOptions}
        getRowHeight={getRowHeight}
        getRowSpacing={getRowSpacing}
        scrollbarSize={0}
        onRowSelectionModelChange={onRowSelectionModelChange}
      />
    </StyledTableContainer>
  );
};

export default ExerciseTable;
