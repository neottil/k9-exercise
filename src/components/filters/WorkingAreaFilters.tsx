import { useState } from "react";
import { TableFiltersProps } from "./interface";
import {
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Collapse, Container, Button, Typography } from "@mui/material";
import LevelSelect from "./LevelSelect";

const WorkingAreaFilters = ({ onChangeCallback }: TableFiltersProps) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <Container sx={{ py: "0.8em", px: 0.4 }} maxWidth={false} disableGutters>
      <Button onClick={toggleFilters} variant="contained" fullWidth>
        <SearchIcon sx={{ mr: "0.5em" }} />
        <Typography variant="h6" sx={{ mr: "0.5em" }}>
          Area
        </Typography>
        {isFiltersVisible ? (
          <ExpandLess onClick={toggleFilters} />
        ) : (
          <ExpandMore onClick={toggleFilters} />
        )}
      </Button>
      {isFiltersVisible && <Collapse in={isFiltersVisible}>
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
      </Collapse>}
    </Container>
  );
};

export default WorkingAreaFilters;
