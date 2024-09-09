import { useState } from "react";
import {
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Collapse, Container, Button, Typography } from "@mui/material";
import LevelSelect from "./LevelSelect";

interface WorkingAreaFiltersProps {
  onChangeCallback?: (name: string, value: string) => void;
}


const WorkingAreaFilters = ({ onChangeCallback }: WorkingAreaFiltersProps) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <Container sx={{ py: "0.8em" }} maxWidth={false} disableGutters>
      <Button onClick={toggleFilters} variant="contained" fullWidth>
        <SearchIcon sx={{ mr: "0.5em" }} />
        <Typography variant="h6" sx={{ mr: "0.5em" }}>
          Filtri Area
        </Typography>
        {isFiltersVisible ? (
          <ExpandLess onClick={toggleFilters} />
        ) : (
          <ExpandMore onClick={toggleFilters} />
        )}
      </Button>
      <Collapse in={isFiltersVisible}>
        <LevelSelect
          name="workingAreaMental"
          label="Mentale"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelect
          name="workingAreaFlex"
          label="Flessibilità"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelect
          name="workingAreaStrength"
          label="Forza"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelect
          name="workingAreaBalance"
          label="Equilibrio"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelect
          name="workingAreaCardio"
          label="Cardio"
          onChangeCallback={onChangeCallback}
        />
      </Collapse>
    </Container>
  );
};

export default WorkingAreaFilters;
