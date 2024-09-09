import { useCallback } from "react";
import {
  DataGrid,
  GridColDef,
  GridAutosizeOptions,
  GridColumnHeaderParams,
} from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

import type { Schema } from "../../../amplify/data/resource";
import WorkingAreaTable from "./WorkingAreaTable";
import BodyTargetTable from "./BodyTargetTable";
import MovementPlan from "./MovementPlan";
import Tools from "./Tools";

interface ExerciseTableProps {
  rows: Array<Schema["Exercise"]["type"]>;
}

const renderHeader = (params: GridColumnHeaderParams) => (
  <strong style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
    {params.colDef.headerName}
  </strong>
);

const StyledTableHeader = styled(Box)(({ theme }) => ({
  ["& .super-app-theme--header"]: {
    backgroundColor: theme.palette.primary.main,
  },
}));

const columnsDef: GridColDef[] = [
  {
    field: "type",
    headerName: "Tipologia",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 150,
  },
  {
    field: "description",
    headerName: "Descrizione",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 300,
    flex: 0.5
  },
  {
    field: "tools",
    headerName: "Attrezzi",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 150,
    renderCell: Tools,
  },
  {
    field: "setup",
    headerName: "Setup",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 120,
    flex: 0.4
  },
  {
    field: "workingAreas",
    headerName: "Aree Di Lavoro",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 300,
    renderCell: WorkingAreaTable,
    flex: 1
  },
  {
    field: "bodyTargets",
    headerName: "Body Target",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 300,
    renderCell: BodyTargetTable,
    flex: 1
  },
  {
    field: "movementPlans",
    headerName: "Piano di Movimento",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 130,
    renderCell: MovementPlan,
  },
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
    <StyledTableHeader>
      <DataGrid
        rows={rows}
        columns={columnsDef}
        getRowHeight={() => "auto"}
        autosizeOptions={autosizeOptions}
        getRowSpacing={getRowSpacing}
      />
    </StyledTableHeader>
  );};

export default ExerciseTable;
