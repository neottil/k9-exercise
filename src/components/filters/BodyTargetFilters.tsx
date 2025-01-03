import { useState } from "react";
import { BodyTargetViewFilters } from "../../interfaces/filterInterfaces";
import {
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Collapse, Button, Typography, Box } from "@mui/material";
import LevelSelectWithOperation from "../LevelSelect/WithOperation";

const BodyTargetFilters = ({ value, onChangeCallback, resetCallback }: BodyTargetViewFilters) => {
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
          value={value.ant}
          name="bodyTarget.ant"
          label="Anteriore"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
        <LevelSelectWithOperation
          value={value.post}
          name="bodyTarget.post"
          label="Posteriore"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
        <LevelSelectWithOperation
          value={value.core}
          name="bodyTarget.core"
          label="Core"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
        <LevelSelectWithOperation
          value={value.backbone}
          name="bodyTarget.backbone"
          label="Colonna"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
        <LevelSelectWithOperation
          value={value.fullBody}
          name="bodyTarget.fullBody"
          label="Fullbody"
          onChangeCallback={onChangeCallback}
          resetCallback={resetCallback}
        />
      </Collapse>
    </Box>
  );
};

export default BodyTargetFilters;
