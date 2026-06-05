import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

import { Exercise } from "../../interfaces/exerciseInterfaces";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
  }
}));

const BodyTargetTable = ({ row }: { row: Exercise }) => (
  <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <StyledTableCell align="center">Anteriore</StyledTableCell>
          <StyledTableCell align="center">Posteriore</StyledTableCell>
          <StyledTableCell align="center">Core</StyledTableCell>
          <StyledTableCell align="center">Colonna</StyledTableCell>
          <StyledTableCell align="center">Fullbody</StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow key={row.id}>
          <TableCell align="center">{row.bodyTarget?.ant}</TableCell>
          <TableCell align="center">{row.bodyTarget?.post}</TableCell>
          <TableCell align="center">{row.bodyTarget?.core}</TableCell>
          <TableCell align="center">{row.bodyTarget?.backbone}</TableCell>
          <TableCell align="center">{row.bodyTarget?.fullBody}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

export default BodyTargetTable;