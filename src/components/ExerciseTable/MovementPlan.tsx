import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

import type { Schema } from "../../../amplify/data/resource";

const MovementPlan = ({ row }: { row: Schema["Exercise"]["type"] }) => (
  <Box>
    <List>
      {row.movementPlan?.map((plan) => (
        <ListItem key={plan}>{plan}</ListItem>
      ))}
    </List>
  </Box>
);

export default MovementPlan;