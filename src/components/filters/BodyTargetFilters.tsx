import { useState } from "react";
import { SimpleFiltersProps } from "../../interfaces/filterInterfaces";
import {
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Collapse, Button, Typography, Box } from "@mui/material";
import LevelSelectWithOperation from "../LevelSelect/WithOperation";

const BodyTargetFilters = ({ onChangeCallback }: SimpleFiltersProps) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <Box sx={{ p: 0.5 }}>
      <Button onClick={toggleFilters} variant="contained" fullWidth>
        <SearchIcon sx={{ mr: 0.5 }} />
        <Typography variant="h6" sx={{ mr: 0.5 }}>
          Body Target
        </Typography>
        {isFiltersVisible ? (
          <ExpandLess onClick={toggleFilters} />
        ) : (
          <ExpandMore onClick={toggleFilters} />
        )}
      </Button>
      <Collapse in={isFiltersVisible}>
        <LevelSelectWithOperation
          name="ant"
          label="Anteriore"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelectWithOperation
          name="post"
          label="Posteriore"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelectWithOperation
          name="core"
          label="Core"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelectWithOperation
          name="backbone"
          label="Colonna"
          onChangeCallback={onChangeCallback}
        />
        <LevelSelectWithOperation
          name="fullbody"
          label="Fullbody"
          onChangeCallback={onChangeCallback}
        />
      </Collapse>
    </Box>
  );
};

export default BodyTargetFilters;
