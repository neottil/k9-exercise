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

interface ExerciseTableProps {
  rows: Array<Schema["Exercise"]["type"]>;
}

const renderHeader = (params: GridColumnHeaderParams) => (
  <strong>
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
    minWidth: 200,
  },
  {
    field: "description",
    headerName: "Descrizione",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 300,
    flex: 1.5,
  },
  {
    field: "workingAreas",
    headerName: "Aree",
    headerClassName: "super-app-theme--header",
    renderHeader,
    minWidth: 300,
    flex: 0.8,
    renderCell: WorkingAreaTable,
  },
];

const autosizeOptions: GridAutosizeOptions = {
  includeOutliers: true,
};

const ExerciseTable = ({ rows }: ExerciseTableProps) => (
  <StyledTableHeader>
    <DataGrid
      rows={rows}
      columns={columnsDef}
      getRowHeight={() => "auto"}
      autosizeOptions={autosizeOptions}
    />
  </StyledTableHeader>
);

export default ExerciseTable;
