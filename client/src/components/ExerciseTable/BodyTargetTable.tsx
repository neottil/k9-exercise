import { StatBars, BODY_TARGET_LABELS } from "../StatBars";
import type { Exercise } from "../../interfaces/exerciseInterfaces";

const BodyTargetTable = ({ row }: { row: Exercise }) => (
  <StatBars
    data={row.bodyTarget as unknown as Record<string, number>}
    labels={BODY_TARGET_LABELS}
    showAll
  />
);

export default BodyTargetTable;
