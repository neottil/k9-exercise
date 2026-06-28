// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useState } from "react";
import { Box, Button, Chip, MenuItem, Select, TextField } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { capitalize } from "../../utils/stringUtils";

type OnChangeCallback = (name: string, value: string[]) => void

interface ArrayFieldProps {
  name: string,
  items: string[],
  onChange: OnChangeCallback,
  options?: readonly string[]
}

const ArrayField = ({
  items,
  onChange,
  name,
  options
}: ArrayFieldProps) => {
  const DEFAULT_CURRENT_VALUE = "";
  const [currentValue, setCurrentValue] = useState<string>(DEFAULT_CURRENT_VALUE);

  const onChangeCurrentValue = (event: { target: { value: string; name: string } }) =>
    setCurrentValue(event.target.value);

  const removeItem = (removeIndex: number) => {
    onChange(name, items.filter((_value, index) => index !== removeIndex));
  };

  const addItem = () => {
    const trimmed = currentValue.trim();
    if (!trimmed) return;
    const capitalized = capitalize(trimmed);
    if (items.some(item => item.toLowerCase() === capitalized.toLowerCase())) return;
    onChange(name, [...items, capitalized]);
    setCurrentValue(DEFAULT_CURRENT_VALUE);
  };

  const canAddItem = (() => {
    const trimmed = currentValue.trim();
    if (!trimmed) return false;
    const capitalized = capitalize(trimmed);
    return !items.some(item => item.toLowerCase() === capitalized.toLowerCase());
  })();

  const arraySection = !!items?.length && (
    <Box sx={{ overflow: "auto", maxHeight: "7rem", mt: 0.5 }}>
      {items.map((value, index) => (
        <Chip
          key={index}
          label={value}
          color="primary"
          onDelete={() => removeItem(index)}
          deleteIcon={<CancelIcon fontSize="small" />}
          sx={{ mr: 0.5, mt: 0.5 }}
        />
      ))}
    </Box>
  );

  return (
    <>
      {!options && (
        <TextField
          fullWidth
          name={name}
          value={currentValue}
          onChange={onChangeCurrentValue}
        />
      )}
      {!!options && (
        <Select
          fullWidth
          name={name}
          value={currentValue}
          onChange={onChangeCurrentValue}
        >
          {options.filter((opt) => !items.includes(opt)).map((opt: string) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      )}
      <Button onClick={addItem} variant="text" disabled={!canAddItem}>
        Aggiungi
      </Button>
      {arraySection}
    </>
  );
};

export default ArrayField;
