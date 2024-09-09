import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

import type { Schema } from "../../../amplify/data/resource";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
  }
}));

const BodyTargetTable = ({ row }: { row: Schema["Exercise"]["type"] }) => (
  <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <StyledTableCell align="right">Anteriore</StyledTableCell>
          <StyledTableCell align="right">Posteriore</StyledTableCell>
          <StyledTableCell align="right">Core</StyledTableCell>
          <StyledTableCell align="right">Colonna</StyledTableCell>
          <StyledTableCell align="right">Fullbody</StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow key={row.id}>
          <TableCell align="right">{row.bodyTarget?.ant}</TableCell>
          <TableCell align="right">{row.bodyTarget?.post}</TableCell>
          <TableCell align="right">{row.bodyTarget?.core}</TableCell>
          <TableCell align="right">{row.bodyTarget?.backbone}</TableCell>
          <TableCell align="right">{row.bodyTarget?.fullBody}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

export default BodyTargetTable;