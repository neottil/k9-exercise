import Box from "@mui/material/Box";
import {
  GridColumnHeaderParams,
} from "@mui/x-data-grid";
import type { Schema } from "../../../amplify/data/resource";
import WorkingAreaTable from "./WorkingAreaTable";
import BodyTargetTable from "./BodyTargetTable";
import { Chip } from "@mui/material";

const renderHeader = (params: GridColumnHeaderParams) => (
  <strong style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
    {params.colDef.headerName}
  </strong>
);

const id = {
  field: "id",
  headerName: "Id",
  renderHeader: (params: GridColumnHeaderParams) => (
    <Box sx={{ display: "none" }}>{params.colDef.headerName}</Box>
  ),
  renderCell: ({ row }: { row: Schema["Exercise"]["type"] }) => (
    <Box sx={{ display: "none" }}>{row.id}</Box>
  ),
  minWidth: 1,
  maxWidth: 1,
};

const type = {
  field: "type",
  headerName: "Tipologia",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 150,
};

const description = {
  field: "description",
  sortable: false,
  headerName: "Descrizione",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 300,
  flex: 0.5,
};

const tools = {
  field: "tools",
  sortable: false,
  headerName: "Attrezzi",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 150,
  renderCell: ({ row }: { row: Schema["Exercise"]["type"] }) => row.tools?.map((tool) => <Chip key={tool} label={tool} sx={{ m: 0.5 }}/>)
};

const setup = {
  field: "setup",
  sortable: false,
  headerName: "Setup",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 120,
  flex: 0.4,
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
  flex: 1,
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
  flex: 1,
};

const movementPlan = {
  field: "movementPlan",
  sortable: false,
  headerName: "Piano di Movimento",
  headerClassName: "super-app-theme--header",
  renderHeader,
  minWidth: 130,
  flex: 0.4,
  renderCell: ({ row }: { row: Schema["Exercise"]["type"] }) => row.movementPlan?.map((plan) => <Chip key={plan} label={plan} sx={{ m: 0.5 }}/>)
};

export {
  id,
  type,
  description,
  tools,
  setup,
  workingAreas,
  bodyTargets,
  movementPlan,
};
