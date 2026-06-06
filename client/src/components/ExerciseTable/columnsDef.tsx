import { Chip } from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import { GridColDef, GridColumnHeaderParams } from "@mui/x-data-grid";
import { NavigateFunction } from "react-router-dom";
import { Exercise } from "../../interfaces/exerciseInterfaces";
import WorkingAreaTable from "./WorkingAreaTable";
import BodyTargetTable from "./BodyTargetTable";

export const renderHeader = (params: GridColumnHeaderParams) => (
  <strong style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
    {params.colDef.headerName}
  </strong>
);

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

const variant: GridColDef = {
  field: "variant",
  headerName: "Variante",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 110,
  flex: 0.1,
};

const description: GridColDef = {
  field: "description",
  sortable: false,
  headerName: "Descrizione",
  headerClassName: "super-app-theme--header",
  renderHeader,
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
    row.tools?.map((tool) => <Chip key={tool} label={tool} sx={{ m: 0.5 }} />),
  flex: 0.3,
};

const setup: GridColDef = {
  field: "setup",
  sortable: false,
  headerName: "Setup",
  headerClassName: "super-app-theme--header",
  renderHeader,
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
    row.movementPlan?.map((plan) => <Chip key={plan} label={plan} sx={{ m: 0.5 }} />),
  flex: 0.1,
};

const difficultyLevel: GridColDef = {
  field: "difficultyLevel",
  headerName: "Difficoltà",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 80,
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
