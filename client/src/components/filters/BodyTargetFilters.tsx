import { useState } from "react";
import { BodyTargetViewFilters } from "../../interfaces/filterInterfaces";
import { ExpandLess, ExpandMore, Search as SearchIcon } from "@mui/icons-material";
import { Collapse, Button, Typography, Box } from "@mui/material";
import { StatBarsFilter, BODY_TARGET_LABELS } from "../StatBars";

const BodyTargetFilters = ({ value, onChangeCallback, resetCallback }: BodyTargetViewFilters) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  return (
    <Box sx={{ p: 0.5, flexGrow: 1 }}>
      <Button onClick={() => setIsFiltersVisible((v) => !v)} variant="contained" fullWidth>
        <SearchIcon sx={{ mr: 0.5 }} />
        <Typography variant="h6" sx={{ mr: 0.5 }}>
          Body Target
        </Typography>
        {isFiltersVisible ? <ExpandLess /> : <ExpandMore />}
      </Button>
      <Collapse in={isFiltersVisible}>
        <StatBarsFilter
          data={value as unknown as Record<string, { value: number; operation: "eq" | "gte" }>}
          labels={BODY_TARGET_LABELS}
          fieldPrefix="bodyTarget"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
      </Collapse>
    </Box>
  );
};

export default BodyTargetFilters;
