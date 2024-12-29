import { useState } from "react";
import { SimpleFiltersProps } from "../../interfaces/filterInterfaces";
import {
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Collapse, Button, Typography, Box } from "@mui/material";
import LevelSelect from "../LevelSelect";

const WorkingAreaFilters = ({ onChangeCallback }: SimpleFiltersProps) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <Box sx={{ p: 0.5 }}>
      <Button onClick={toggleFilters} variant="contained" fullWidth>
        <SearchIcon sx={{ mr: 0.5 }} />
        <Typography variant="h6" sx={{ mr: 0.5 }}>
          Area
        </Typography>
        {isFiltersVisible ? (
          <ExpandLess onClick={toggleFilters} />
        ) : (
          <ExpandMore onClick={toggleFilters} />
        )}
      </Button>
      {isFiltersVisible && (
        <Collapse in={isFiltersVisible}>
          <LevelSelect
            name="mental"
            label="Mentale"
            onChangeCallback={onChangeCallback}
          />
          <LevelSelect
            name="flexibility"
            label="Flessibilità"
            onChangeCallback={onChangeCallback}
          />
          <LevelSelect
            name="strength"
            label="Forza"
            onChangeCallback={onChangeCallback}
          />
          <LevelSelect
            name="balance"
            label="Equilibrio"
            onChangeCallback={onChangeCallback}
          />
          <LevelSelect
            name="cardio"
            label="Cardio"
            onChangeCallback={onChangeCallback}
          />
        </Collapse>
      )}
    </Box>
  );
};

export default WorkingAreaFilters;
