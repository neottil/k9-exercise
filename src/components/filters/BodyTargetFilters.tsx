import { useState } from "react";
import { TableFiltersProps } from "./interface";
import {
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Collapse, Container, Button, Typography } from "@mui/material";
import LevelSelect from "./LevelSelect";

const BodyTargetFilters = ({ onChangeCallback }: TableFiltersProps) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <Container sx={{ py: "0.8em", px: 0.4 }} maxWidth={false} disableGutters>
      <Button onClick={toggleFilters} variant="contained" fullWidth>
        <SearchIcon sx={{ mr: "0.5em" }} />
        <Typography variant="h6" sx={{ mr: "0.5em" }}>
          Body Target
        </Typography>
        {isFiltersVisible ? (
          <ExpandLess onClick={toggleFilters} />
        ) : (
          <ExpandMore onClick={toggleFilters} />
        )}
      </Button>
      <Collapse in={isFiltersVisible}>
        <LevelSelect
          name="ant"
          label="Anteriore"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelect
          name="post"
          label="Posteriore"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelect
          name="core"
          label="Core"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelect
          name="backbone"
          label="Colonna"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelect
          name="fullbody"
          label="Fullbody"
          onChangeCallback={onChangeCallback}
        />
      </Collapse>
    </Container>
  );
};

export default BodyTargetFilters;
