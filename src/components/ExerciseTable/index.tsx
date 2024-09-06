import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef, GridAutosizeOptions } from "@mui/x-data-grid";
import type { Schema } from "../../../amplify/data/resource";

interface ExerciseTableProps {
  rows: Array<Schema["Exercise"]["type"]>;
}

const columnsDef: GridColDef[] = [
  { field: "type", headerName: "Tipologia" },
  { field: "description", headerName: "Descrizione", minWidth: 300, flex: 1.5 },
  {
    field: "workingAreas",
    headerName: "Area",
    minWidth: 300, flex: 1,
    valueGetter: (_value, row) => JSON.stringify(row.workingArea),
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
