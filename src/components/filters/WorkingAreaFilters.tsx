import { useState } from "react";
import { SimpleFiltersProps } from "../../interfaces/filterInterfaces";
import {
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Collapse, Button, Typography, Box } from "@mui/material";
import LevelSelectWithOperation from "../LevelSelect/WithOperation";

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
          name="mental"
          label="Mentale"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelectWithOperation
          name="flexibility"
          label="Flessibilità"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelectWithOperation
          name="strength"
          label="Forza"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelectWithOperation
          name="balance"
          label="Equilibrio"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelectWithOperation
          name="cardio"
          label="Cardio"
          onChangeCallback={onChangeCallback}
        />
      </Collapse>
    </Box>
  );
};

export default WorkingAreaFilters;
