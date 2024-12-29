import { useCallback, useEffect, useState } from "react";
import { SelectFieldProps, OnChangeCallback, OperationFilter } from "../../interfaces/filterInterfaces";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent
} from "@mui/material";
import LevelSelect from ".";

const DEFAULT_SELECTED = "";
const DEFAULT_OPERATION = "eq";

const LevelSelectWithOperation = ({
  name,
  label,
  onChangeCallback
}: SelectFieldProps) => {
  const [selected, setSelected] = useState<string>(DEFAULT_SELECTED);
  const [selectedOp, setSelectedOp] = useState<OperationFilter>(DEFAULT_OPERATION);

  useEffect(
    () => onChangeCallback && onChangeCallback(name, selected, selectedOp),
    [name, selected, selectedOp]
  );

  const onChangeLevelCallback: OnChangeCallback = useCallback(
    (_name, value) => {
      setSelected(value);
    }, []);

  const handleChangeOp = (event: SelectChangeEvent<OperationFilter>) => {
    setSelectedOp(event.target.value as OperationFilter);
  };

  const resetCallback = () => {
    setSelectedOp(DEFAULT_OPERATION);
  }

  return (
    <Box display="inline-flex" sx={{ m: 1 }}>
      <LevelSelect
        name={name}
        label={label}
        onChangeCallback={onChangeLevelCallback}
        resetCallback={resetCallback}
      />
      <Select name="operation" value={selectedOp} onChange={handleChangeOp}>
        <MenuItem value="eq">{"="}</MenuItem>
        <MenuItem value="gt">{">="}</MenuItem>
      </Select>
    </Box>
  );
};

export default LevelSelectWithOperation;
