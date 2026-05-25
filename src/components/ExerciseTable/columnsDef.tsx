import { Chip } from "@mui/material";
import { GridColumnHeaderParams } from "@mui/x-data-grid";
import { Exercise } from "../../interfaces/exerciseInterfaces";
import WorkingAreaTable from "./WorkingAreaTable";
import BodyTargetTable from "./BodyTargetTable";

const renderHeader = (params: GridColumnHeaderParams) => (
  <strong style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
    {params.colDef.headerName}
  </strong>
);

const id = {
  field: "id",
  headerName: "Id",
  renderHeader,
  minWidth: 100,
};

const type = {
  field: "type",
  headerName: "Tipologia",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 110,
  flex: 0.1
};

const variant = {
  field: "variant",
  headerName: "Variante",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 110,
  flex: 0.1
};

const description = {
  field: "description",
  sortable: false,
  headerName: "Descrizione",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 300,
  flex: 0.1
};

const tools = {
  field: "tools",
  sortable: false,
  headerName: "Attrezzi",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 80,
  renderCell: ({ row }: { row: Exercise }) =>
    row.tools?.map((tool) => <Chip key={tool} label={tool} sx={{ m: 0.5 }} />),
  flex: 0.3
};

const setup = {
  field: "setup",
  sortable: false,
  headerName: "Setup",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 300,
  flex: 0.1
};

const workingAreas = {
  field: "workingAreas",
  filterable: false,
  sortable: false,
  headerName: "Aree Di Lavoro",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 300,
  renderCell: WorkingAreaTable,
  flex: 1
};

const bodyTargets = {
  field: "bodyTargets",
  filterable: false,
  sortable: false,
  headerName: "Body Target",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 300,
  renderCell: BodyTargetTable,
  flex: 1
};

const movementPlan = {
  field: "movementPlan",
  sortable: false,
  headerName: "Piano di Movimento",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 130,
  renderCell: ({ row }: { row: Exercise }) =>
    row.movementPlan?.map((plan) => <Chip key={plan} label={plan} sx={{ m: 0.5 }} />),
  flex: 0.1
};

const difficultyLevel = {
  field: "difficultyLevel",
  headerName: "Difficoltà",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 80
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
  difficultyLevel
};
