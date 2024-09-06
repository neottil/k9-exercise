import {
  DataGrid,
  GridColDef,
  GridAutosizeOptions,
} from "@mui/x-data-grid";
import Box from "@mui/material/Box";

import type { Schema } from "../../../amplify/data/resource";
import WorkingAreaTable from "./WorkingAreaTable";

interface ExerciseTableProps {
  rows: Array<Schema["Exercise"]["type"]>;
}

const columnsDef: GridColDef[] = [
  { field: "type", headerName: "Tipologia", minWidth: 200 },
  { field: "description", headerName: "Descrizione", minWidth: 300, flex: 1.5 },
  {
    field: "workingAreas",
    headerName: "Aree",
    minWidth: 300,
    flex: 0.8,
    renderCell: WorkingAreaTable,
  },
];

const autosizeOptions: GridAutosizeOptions = {
  includeOutliers: true,
};

const ExerciseTable = ({ rows }: ExerciseTableProps) => (
  <Box>
    <DataGrid
      rows={rows}
      columns={columnsDef}
      getRowHeight={() => "auto"}
      autosizeOptions={autosizeOptions}
    />
  </Box>
);

export default ExerciseTable;
