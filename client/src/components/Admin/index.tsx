// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import PendingChangesTab from "./PendingChangesTab";
import NewExercisesTab from "./NewExercisesTab";
import AuditTab from "./AuditTab";

const Admin = () => {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px - 48px)", overflow: "hidden" }}>

      <Box sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Tabs value={tabValue} onChange={(_, v: number) => setTabValue(v)}>
          <Tab label="Modifiche esercizi" />
          <Tab label="Nuovi esercizi" />
          <Tab label="Audit" />
        </Tabs>
      </Box>

      {tabValue === 0 && <PendingChangesTab />}
      {tabValue === 1 && <NewExercisesTab />}
      {tabValue === 2 && <AuditTab />}

    </Box>
  );
};

export default Admin;
