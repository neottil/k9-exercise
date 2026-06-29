// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Chip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { GridColDef, GridColumnHeaderParams, GridRenderCellParams } from "@mui/x-data-grid";
import { NavigateFunction } from "react-router-dom";
import { Exercise } from "../../interfaces/exerciseInterfaces";
import WorkingAreaTable from "./WorkingAreaTable";
import BodyTargetTable from "./BodyTargetTable";

export const renderHeader = (params: GridColumnHeaderParams) => (
  <strong style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
    {params.colDef.headerName}
  </strong>
);

// Evita che DataGrid aggiunga il tooltip nativo (title) sulle celle di testo semplice.
// Il title viene impostato solo quando renderCell non è definita; wrappare in un
// fragment è sufficiente a segnalare che children non è undefined.
const noTooltip = ({ value }: GridRenderCellParams) => <>{value}</>;

const id: GridColDef = {
  field: "id",
  headerName: "Id",
  renderHeader,
  minWidth: 100,
};

const type: GridColDef = {
  field: "type",
  headerName: "Tipologia",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 110,
  flex: 0.1,
};

/**
 * Factory che restituisce la colonna "Tipologia" con il bottone edit sovrapposto.
 * Riceve navigate come parametro perché è un hook non usabile fuori dai componenti.
 * In ExerciseTable va chiamata dentro useMemo([navigate]).
 */
export const createTypeColumn = (navigate: NavigateFunction): GridColDef => ({
  ...type,
  renderCell: ({ row }: { row: Exercise }) => (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 52,
        pt: 0.5,
      }}
    >
      {row.type}
      <IconButton
        className="edit-action"
        size="small"
        sx={{
          position: "absolute",
          bottom: 5,
          left: 4,
          zIndex: 2,
          bgcolor: "primary.main",
          color: "white",
          border: 1,
          borderColor: "primary.main",
          p: "3px",
          "&:hover": {
            bgcolor: "grey.300",
            color: "text.primary",
            borderColor: "grey.300",
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/update/${row.id}`);
        }}
        title="Modifica esercizio"
      >
        <EditIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  ),
});

/**
 * Factory per la colonna "Immagini": mostra l'icona occhio solo se l'esercizio
 * ha immagini; al click apre la modale a carosello tramite il callback onView.
 */
export const createImagesColumn = (onView: (exercise: Exercise) => void): GridColDef => ({
  field: "images",
  headerName: "Immagini",
  headerClassName: "super-app-theme--header",
  renderHeader,
  filterable: false,
  sortable: false,
  minWidth: 90,
  renderCell: ({ row }: { row: Exercise }) =>
    row.images?.length ? (
      <IconButton
        size="small"
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          onView(row);
        }}
        title={`Visualizza ${row.images.length} immagin${row.images.length === 1 ? "e" : "i"}`}
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
    ) : null,
});

const variant: GridColDef = {
  field: "variant",
  headerName: "Variante",
  headerClassName: "super-app-theme--header",
  renderHeader,
  renderCell: noTooltip,
  minWidth: 110,
  flex: 0.1,
};

const description: GridColDef = {
  field: "description",
  sortable: false,
  headerName: "Descrizione",
  headerClassName: "super-app-theme--header",
  renderHeader,
  renderCell: noTooltip,
  minWidth: 300,
  flex: 0.1,
};

const tools: GridColDef = {
  field: "tools",
  sortable: false,
  headerName: "Attrezzi",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 80,
  renderCell: ({ row }: { row: Exercise }) =>
    row.tools?.map((tool) => <Chip key={tool} label={tool} color="primary" sx={{ m: 0.5 }} />),
  flex: 0.3,
};

const setup: GridColDef = {
  field: "setup",
  sortable: false,
  headerName: "Setup",
  headerClassName: "super-app-theme--header",
  renderHeader,
  renderCell: noTooltip,
  minWidth: 300,
  flex: 0.1,
};

const workingAreas: GridColDef = {
  field: "workingAreas",
  filterable: false,
  sortable: false,
  headerName: "Aree Di Lavoro",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 180,
  renderCell: WorkingAreaTable,
  flex: 1,
};

const bodyTargets: GridColDef = {
  field: "bodyTargets",
  filterable: false,
  sortable: false,
  headerName: "Body Target",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 180,
  renderCell: BodyTargetTable,
  flex: 1,
};

const movementPlan: GridColDef = {
  field: "movementPlan",
  sortable: false,
  headerName: "Piano di Movimento",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 130,
  renderCell: ({ row }: { row: Exercise }) =>
    row.movementPlan?.map((plan) => <Chip key={plan} label={plan} color="primary" sx={{ m: 0.5 }} />),
  flex: 0.1,
};

const difficultyLevel: GridColDef = {
  field: "difficultyLevel",
  headerName: "Difficoltà",
  headerClassName: "super-app-theme--header",
  renderHeader,
  renderCell: noTooltip,
  minWidth: 80,
};

export const instructorLevel: GridColDef = {
  field: "instructorLevel",
  headerName: "Livello",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 90,
  renderCell: ({ value }: GridRenderCellParams) =>
    value ? (
      <Chip
        label={value as string}
        size="small"
        color={value === "CTS" ? "warning" : "primary"}
      />
    ) : (
      <Typography variant="body2" color="text.disabled">—</Typography>
    ),
};

export {
  id,
  type,
  variant,
  description,
  tools,
  setup,
  workingAreas,
  bodyTargets,
  movementPlan,
  difficultyLevel,
};
