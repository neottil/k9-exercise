import { useState } from "react";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { capitalize } from "../../functions/stringUtils";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

interface LevelSelectProps {
    name: string;
    label: string; 
  onChangeCallback?: (name: string, value: string) => void;
}

const LevelSelect = ({ name, label, onChangeCallback }: LevelSelectProps) => {
    const [selected, setSelected] = useState<string>("");

    const handleChange = (event: SelectChangeEvent) => {
      setSelected(event.target.value);
      onChangeCallback &&
        onChangeCallback(event.target.name, event.target.value);
    };

    const resetSelection = () => {
      setSelected("");
      onChangeCallback && onChangeCallback(name, "");
    };

    return (
        <FormControl sx={{ m: 1, minWidth: 150 }}>
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
            >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>5</MenuItem>
            </Select>
        </FormControl>
    );
};

export default LevelSelect;
