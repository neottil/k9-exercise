import { useMemo } from "react";
import { LevelSelectProps } from "../../interfaces/filterInterfaces";
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

const LevelSelect = ({
  value,
  name,
  label,
  onChangeCallback,
  resetCallback,
  disableAdornment,
  useZeroValue
}: LevelSelectProps) => {

  const handleChange = (event: SelectChangeEvent<string>) => onChangeCallback(name, Number(event.target.value));

  const reset = () => resetCallback && resetCallback(name);

  const getValue = useMemo(() => !!useZeroValue || value !== 0 ? value.toString() : "", [value]);

  return (
    <FormControl sx={{ minWidth: 150 }}>
      <InputLabel>{capitalize(label)}</InputLabel>
      <Select
        name={name}
        value={getValue}
        label={label}
        onChange={handleChange}
        startAdornment={
          !disableAdornment && !!value && (
            <InputAdornment position="start">
              <IconButton onClick={reset}>
                <HighlightOffIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }
        sx={{ minWidth: 90 }}
      >
        {!!useZeroValue && <MenuItem value={"0"}>0</MenuItem>}
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
