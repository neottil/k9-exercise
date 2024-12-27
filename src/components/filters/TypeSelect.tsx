import React, { useEffect, useState } from "react";
import type { Schema } from "../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { SelectTypeProps } from "../../interfaces/filterInterfaces";
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

const LABEL = "Tipologia";
const NAME = "type";
export const DEFAULT = "";

const TypeSelect = ({
  onChangeCallback,
  disabled,
  value
}: SelectTypeProps): React.ReactNode => {
  const [error, setError] = useState<boolean>();
  const [types, setTypes] = useState<Array<string>>();

  // create useEffect to call onChangeCallback with state value (as LevelSelect)
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
    onChangeCallback && onChangeCallback(NAME, event.target.value);
  };

  const resetSelection = () => {
    onChangeCallback && onChangeCallback(NAME, DEFAULT);
  };

  const renderMenuItems = (
    error: boolean | undefined,
    types: string[] | undefined
  ) => {
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
  };

  return (
    <FormControl error={error} fullWidth>
      <InputLabel>Tipologia</InputLabel>
      <Select
        name={NAME}
        value={value}
        label={LABEL}
        onChange={handleChange}
        disabled={disabled}
        startAdornment={
          value && (
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
