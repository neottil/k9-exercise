import { LevelSelectWithOperationProps, NumberOnChangeCallback, OperationFilter } from "../../interfaces/filterInterfaces";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent
} from "@mui/material";
import LevelSelect from ".";

const isOperationEnabled = import.meta.env.VITE_ENABLE_WITH_OPERATION_FILTER === "true";

const LevelSelectWithOperation = ({
  value,
  name,
  label,
  onChangeCallback,
  resetCallback
}: LevelSelectWithOperationProps) => {

  const onChangeLevelCallback: NumberOnChangeCallback = (name, selected) =>
    onChangeCallback(name, selected, isOperationEnabled ? value.operation : "gte");

  const handleChangeOp = (event: SelectChangeEvent<string>) => {
    onChangeCallback(name, value.value, isOperationEnabled ? event.target.value as OperationFilter : "gte");
  };

  return (
    <Box display="inline-flex" sx={{ m: 1 }}>
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
