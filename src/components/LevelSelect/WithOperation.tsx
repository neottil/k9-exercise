import { LevelSelectWithOperationProps, NumberOnChangeCallback, OperationFilter } from "../../interfaces/filterInterfaces";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent
} from "@mui/material";
import LevelSelect from ".";

const LevelSelectWithOperation = ({
  value,
  name,
  label,
  onChangeCallback,
  resetCallback
}: LevelSelectWithOperationProps) => {

  const onChangeLevelCallback: NumberOnChangeCallback = (name, selected) => onChangeCallback(name, selected, value.operation);

  const handleChangeOp = (event: SelectChangeEvent<string>) => {
    onChangeCallback(name, value.value, event.target.value as OperationFilter);
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
      <Select name="operation" value={value.operation} onChange={handleChangeOp}>
        <MenuItem value="eq">{"="}</MenuItem>
        <MenuItem value="gt">{">="}</MenuItem>
      </Select>
    </Box>
  );
};

export default LevelSelectWithOperation;
