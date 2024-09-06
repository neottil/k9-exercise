import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type { Schema } from "../../amplify/data/resource";

interface ExerciseTableProps {
  rows: Array<Schema["Exercise"]["type"]>;
}

const columnsDef: GridColDef[] = [
  { field: "type", headerName: "Tipologia" },
  { field: "description", headerName: "Descrizione" },
  {
    field: "workingAreas",
    headerName: "Area",
    valueGetter: (_value, row) => JSON.stringify(row.workingArea),
  },
];

const ExerciseTable = ({ rows }: ExerciseTableProps) => (
  <Box>
    <DataGrid rows={rows} columns={columnsDef} />
  </Box>
);

export default ExerciseTable;
