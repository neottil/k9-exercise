// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

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
