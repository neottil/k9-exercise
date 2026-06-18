// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

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
