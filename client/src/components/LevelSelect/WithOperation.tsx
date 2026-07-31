// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { LevelSelectWithOperationProps, NumberOnChangeCallback, OperationFilter } from "../../interfaces/filterInterfaces";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent
} from "@mui/material";
import LevelSelect from ".";
import { getConfig } from "../../config/runtime";

const LevelSelectWithOperation = ({
  value,
  name,
  label,
  onChangeCallback,
  resetCallback
}: LevelSelectWithOperationProps) => {
  // Letta qui e non a livello di modulo: la config è risolta a runtime
  // all'avvio (vedi config/runtime.ts), dopo la valutazione degli import.
  const isOperationEnabled = getConfig().enableWithOperationFilter;

  const onChangeLevelCallback: NumberOnChangeCallback = (name, selected) =>
    onChangeCallback(name, selected, isOperationEnabled ? value.operation : "gte");

  const handleChangeOp = (event: SelectChangeEvent<string>) => {
    onChangeCallback(name, value.value, isOperationEnabled ? event.target.value as OperationFilter : "gte");
  };

  return (
    <Box sx={{ display: "inline-flex", m: 1 }}>
      <LevelSelect
        value={value.value}
        name={name}
        label={label}
        onChangeCallback={onChangeLevelCallback}
        resetCallback={resetCallback}
      />
      {isOperationEnabled && (
        <Select name="operation" value={value.operation} onChange={handleChangeOp}>
          <MenuItem value="eq">{"="}</MenuItem>
          <MenuItem value="gte">{">="}</MenuItem>
        </Select>
      )}
    </Box>
  );
};

export default LevelSelectWithOperation;
