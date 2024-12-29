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

const WorkingAreaTable = ({
  row,
}: {
  row: Schema["Exercise"]["type"];
}) => (
  <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <StyledTableCell align="center">Mentale</StyledTableCell>
          <StyledTableCell align="center">Flessibilità</StyledTableCell>
          <StyledTableCell align="center">Forza</StyledTableCell>
          <StyledTableCell align="center">Equilibrio</StyledTableCell>
          <StyledTableCell align="center">Cardio</StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow key={row.id}>
          <TableCell align="center">{row.workingArea?.mental}</TableCell>
          <TableCell align="center">{row.workingArea?.flexibility}</TableCell>
          <TableCell align="center">{row.workingArea?.strength}</TableCell>
          <TableCell align="center">{row.workingArea?.balance}</TableCell>
          <TableCell align="center">{row.workingArea?.cardio}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

export default WorkingAreaTable;