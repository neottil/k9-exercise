import { StatBars, WORKING_AREA_LABELS } from "../StatBars";
import type { Exercise } from "../../interfaces/exerciseInterfaces";

const WorkingAreaTable = ({ row }: { row: Exercise }) => (
  <StatBars
    data={row.workingArea as unknown as Record<string, number>}
    labels={WORKING_AREA_LABELS}
    showAll
  />
);

export default WorkingAreaTable;
