import { useEffect, useState } from "react";
import type { Schema } from "../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

const client = generateClient<Schema>();

interface TypeSelectProps {
  onChangeCallback?: (name: string, value: string) => void;
}

const TypeSelect = ({ onChangeCallback }: TypeSelectProps) => {
  const [error, setError] = useState<boolean>();
  const [types, setTypes] = useState<Array<string>>();
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const { data, errors } = await client.models.Exercise.list({
        selectionSet: ["type"],
      });
      const types: Array<string> = data.map(({ type }) => type);
      const uniqTypes: Array<string> = [...new Set(types)];
      errors ? setError(true) : !!data && setTypesAndError(uniqTypes, false);
    };
    fetchData();
  }, []);

  const setTypesAndError = (data: Array<string>, error: boolean) => {
    setTypes(data);
    setError(error);
  };

  const handleChange = (event: SelectChangeEvent) => {
    setSelected(event.target.value);
    onChangeCallback && onChangeCallback(event.target.name, event.target.value);
  };

  const resetSelection = () => {
    setSelected("");
    onChangeCallback && onChangeCallback("type", "");
  };

  const renderMenuItems = (error: boolean|undefined, types: string[]|undefined) => {
    if (error) {
      return <MenuItem disabled>Error loading items</MenuItem>;
    }
    return types ? (
      types.map((type: string) => (
        <MenuItem key={type} value={type}>
          {type}
        </MenuItem>
      ))
    ) : (
      <MenuItem disabled>Loading items...</MenuItem>
    );
  }

  return (
    <FormControl sx={{ m: 1, minWidth: 150 }} error={error}>
      <InputLabel>Tipologia</InputLabel>
      <Select
        name="type"
        value={selected}
        label="Tipologia"
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
        {renderMenuItems(error, types)}
      </Select>
      {!!error && <FormHelperText>Error on loading data</FormHelperText>}
    </FormControl>
  );
};

export default TypeSelect;
