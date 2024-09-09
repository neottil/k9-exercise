import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

import type { Schema } from "../../../amplify/data/resource";

const Tools = ({ row }: { row: Schema["Exercise"]["type"] }) => (
  <Box>
    <List>
      {row.tools?.map((tool) => (
        <ListItem key={tool}>{tool}</ListItem>
      ))}
    </List>
  </Box>
);

export default Tools;