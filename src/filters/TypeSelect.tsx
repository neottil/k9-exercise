import { useEffect, useState } from "react";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

const client = generateClient<Schema>();

interface Props {
  onChangeCallback?: (event: SelectChangeEvent) => void;
}

const TypeSelect = ({ onChangeCallback }: Props) => {
  const [error, setError] = useState<boolean>();
  const [types, setTypes] = useState<Array<string>>();
  const [selected, setSelected] = useState<string>("");

  const setTypesAndError = (data: Array<string>, error: boolean) => {
    setTypes(data);
    setError(error);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data, errors } = await client.models.Exercise.list({
        selectionSet: ["type"],
      });
      const types: Array<string> = data.map(({ type }) => type);
      errors ? setError(true) : !!data && setTypesAndError(types, false);
    };
    fetchData();
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    setSelected(event.target.value);
    onChangeCallback && onChangeCallback(event);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 150 }} error={error}>
      <InputLabel>type</InputLabel>
      <Select name="type" value={selected} label="type" onChange={handleChange}>
        {error ? (
          <MenuItem disabled>Error loading items</MenuItem>
        ) : types ? (
          types.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>Loading items...</MenuItem>
        )}
      </Select>
      {!!error && <FormHelperText>Error on loading data</FormHelperText>}
    </FormControl>
  );
};

export default TypeSelect;
