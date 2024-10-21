import { useEffect, useState } from "react";
import { OnChangeCallback } from "./interface";
import {
  Box,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { capitalize } from "../../functions/stringUtils";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

const DEFAULT_SELECTED = "";
const DEFAULT_OPERATION = "eq";

interface LevelSelectProps {
  name: string;
  label: string;
  onChangeCallback?: OnChangeCallback;
}

const LevelSelect = ({ name, label, onChangeCallback }: LevelSelectProps) => {
  const [selected, setSelected] = useState<string>(DEFAULT_SELECTED);
  const [selectedOp, setSelectedOp] = useState<string>(DEFAULT_OPERATION);

  useEffect(
    () => onChangeCallback && onChangeCallback(name, selected, selectedOp),
    [name, onChangeCallback, selected, selectedOp]
  );

  const handleChange = (event: SelectChangeEvent) => {
    setSelected(event.target.value);
  };

  const handleChangeOp = (event: SelectChangeEvent) => {
    setSelectedOp(event.target.value);
  };

  const resetSelection = () => {
    setSelected(DEFAULT_SELECTED);
    setSelectedOp(DEFAULT_OPERATION);
    onChangeCallback &&
      onChangeCallback(name, DEFAULT_SELECTED, DEFAULT_OPERATION);
  };

  return (
    <Box display="inline-flex" sx={{ m: 1 }}>
      <Box display="block">
        <InputLabel>{capitalize(label)}</InputLabel>
        <Select
          name={name}
          value={selected}
          label={label}
          onChange={handleChange}
          startAdornment={
            selected && (
              <InputAdornment position="start">
                <IconButton onClick={resetSelection}>
                  <HighlightOffIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }
          sx={{ minWidth: 90 }}
        >
          <MenuItem value={"0"}>0</MenuItem>
          <MenuItem value={"1"}>1</MenuItem>
          <MenuItem value={"2"}>2</MenuItem>
          <MenuItem value={"3"}>3</MenuItem>
          <MenuItem value={"4"}>4</MenuItem>
          <MenuItem value={"5"}>5</MenuItem>
        </Select>
        <Select name="operation" value={selectedOp} onChange={handleChangeOp}>
          <MenuItem value="eq">{"="}</MenuItem>
          <MenuItem value="gt">{">="}</MenuItem>
        </Select>
      </Box>
    </Box>
  );
};

export default LevelSelect;
