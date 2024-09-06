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
          <StyledTableCell align="right">Mentale</StyledTableCell>
          <StyledTableCell align="right">Flessibilità</StyledTableCell>
          <StyledTableCell align="right">Equilibrio</StyledTableCell>
          <StyledTableCell align="right">Forza</StyledTableCell>
          <StyledTableCell align="right">Cardio</StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow key={row.id}>
          <TableCell align="right">{row.workingArea?.mental}</TableCell>
          <TableCell align="right">{row.workingArea?.flexibility}</TableCell>
          <TableCell align="right">{row.workingArea?.balance}</TableCell>
          <TableCell align="right">{row.workingArea?.strength}</TableCell>
          <TableCell align="right">{row.workingArea?.cardio}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

export default WorkingAreaTable;