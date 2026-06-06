import { useState } from "react";
import { WorkingAreaViewFilters } from "../../interfaces/filterInterfaces";
import { ExpandLess, ExpandMore, Search as SearchIcon } from "@mui/icons-material";
import { Collapse, Button, Typography, Box } from "@mui/material";
import { StatBarsFilter, WORKING_AREA_LABELS } from "../StatBars";

const WorkingAreaFilters = ({ value, onChangeCallback, resetCallback }: WorkingAreaViewFilters) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  return (
    <Box sx={{ p: 0.5, flexGrow: 1 }}>
      <Button onClick={() => setIsFiltersVisible((v) => !v)} variant="contained" fullWidth>
        <SearchIcon sx={{ mr: 0.5 }} />
        <Typography variant="h6" sx={{ mr: 0.5 }}>
          Area target
        </Typography>
        {isFiltersVisible ? <ExpandLess /> : <ExpandMore />}
      </Button>
      <Collapse in={isFiltersVisible}>
        <StatBarsFilter
          data={value as unknown as Record<string, { value: number; operation: "eq" | "gte" }>}
          labels={WORKING_AREA_LABELS}
          fieldPrefix="workingArea"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
      </Collapse>
    </Box>
  );
};

export default WorkingAreaFilters;
