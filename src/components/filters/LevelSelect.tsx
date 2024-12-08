import React, { useEffect, useState } from "react";
import { SelectFieldProps } from "../../interfaces/filterInterfaces";
import {
  Box,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
} from "@mui/material";
import { capitalize } from "../../functions/stringUtils";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

const DEFAULT_SELECTED = "";
const DEFAULT_OPERATION = "eq";

const LevelSelect = ({
  name,
  label,
  onChangeCallback,
}: SelectFieldProps): React.ReactNode => {
  const [selected, setSelected] = useState<string>(DEFAULT_SELECTED);
  const [selectedOp, setSelectedOp] = useState<string>(DEFAULT_OPERATION);

  useEffect(
    () => onChangeCallback && onChangeCallback(name, selected, selectedOp),
    [name, onChangeCallback, selected, selectedOp]
  );

  const handleChange = (event: SelectChangeEvent): void => {
    setSelected(event.target.value);
  };

  const handleChangeOp = (event: SelectChangeEvent): void => {
    setSelectedOp(event.target.value);
  };

  const resetSelection = (): void => {
    setSelected(DEFAULT_SELECTED);
    setSelectedOp(DEFAULT_OPERATION);
    onChangeCallback &&
      onChangeCallback(name, DEFAULT_SELECTED, DEFAULT_OPERATION);
  };

  return (
    <Box display="inline-flex" sx={{ m: 1 }}>
      <Box display="block">
        <FormControl sx={{ minWidth: 150 }}>
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
        </FormControl>
        <Select name="operation" value={selectedOp} onChange={handleChangeOp}>
          <MenuItem value="eq">{"="}</MenuItem>
          <MenuItem value="gt">{">="}</MenuItem>
        </Select>
      </Box>
    </Box>
  );
};

export default LevelSelect;
