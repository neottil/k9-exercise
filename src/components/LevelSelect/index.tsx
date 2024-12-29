import { useEffect, useState } from "react";
import { SelectFieldProps } from "../../interfaces/filterInterfaces";
import {
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
} from "@mui/material";
import { capitalize } from "../../utils/stringUtils";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

const DEFAULT_SELECTED = "";

const LevelSelect = ({
  name,
  label,
  onChangeCallback,
  resetCallback,
  disableAdornment
}: SelectFieldProps) => {
  const [selected, setSelected] = useState<string>(DEFAULT_SELECTED);

  useEffect(
    () => onChangeCallback && onChangeCallback(name, selected),
    [name, selected]
  );

  const handleChange = (event: SelectChangeEvent) => {
    setSelected(event.target.value);
  };

  const reset = () => {
    setSelected(DEFAULT_SELECTED);
    onChangeCallback &&
      onChangeCallback(name, DEFAULT_SELECTED);
    resetCallback && resetCallback();
  };

  return (
    <FormControl sx={{ minWidth: 150 }}>
      <InputLabel>{capitalize(label)}</InputLabel>
      <Select
        name={name}
        value={selected}
        label={label}
        onChange={handleChange}
        startAdornment={
          !disableAdornment && selected && (
            <InputAdornment position="start">
              <IconButton onClick={reset}>
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
  );
};

export default LevelSelect;
