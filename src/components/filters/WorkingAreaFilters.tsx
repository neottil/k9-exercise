import { useState } from "react";
import { WorkingAreaViewFilters } from "../../interfaces/filterInterfaces";
import {
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Collapse, Button, Typography, Box } from "@mui/material";
import LevelSelectWithOperation from "../LevelSelect/WithOperation";

const WorkingAreaFilters = ({ value, onChangeCallback, resetCallback }: WorkingAreaViewFilters) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <Box sx={{ p: 0.5 }}>
      <Button onClick={toggleFilters} variant="contained" fullWidth>
        <SearchIcon sx={{ mr: 0.5 }} />
        <Typography variant="h6" sx={{ mr: 0.5 }}>
          Area target
        </Typography>
        {isFiltersVisible ? (
          <ExpandLess onClick={toggleFilters} />
        ) : (
          <ExpandMore onClick={toggleFilters} />
        )}
      </Button>
      <Collapse in={isFiltersVisible}>
        <LevelSelectWithOperation
          value={value.mental}
          name="workingArea.mental"
          label="Mentale"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
        <LevelSelectWithOperation
          value={value.flexibility}
          name="workingArea.flexibility"
          label="Flessibilità"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
        <LevelSelectWithOperation
          value={value.strength}
          name="workingArea.strength"
          label="Forza"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
        <LevelSelectWithOperation
          value={value.balance}
          name="workingArea.balance"
          label="Equilibrio"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
        <LevelSelectWithOperation
          value={value.cardio}
          name="workingArea.cardio"
          label="Cardio"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
      </Collapse>
    </Box>
  );
};

export default WorkingAreaFilters;
