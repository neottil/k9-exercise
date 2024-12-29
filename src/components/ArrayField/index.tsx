import { useState } from "react";
import { Badge, Icon, ScrollView } from "@aws-amplify/ui-react";
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { OnChangeCallback } from "../../interfaces/filterInterfaces";
import { capitalize } from "../../utils/stringUtils";


interface ArrayFieldProps {
  items: string[], // sono gli elementi selezionati che compaiono nei badge
  onChange: OnChangeCallback, label: string, name: string, options?: readonly string[], required?: boolean
};

const ArrayField = ({
  items,
  onChange,
  label,
  name,
  options,
  required
}: ArrayFieldProps) => {
  const DEFAULT_CURRENT_VALUE = "";
  const [currentValue, setCurrentValue] = useState<string>(DEFAULT_CURRENT_VALUE);

  const onChangeCurrentValue = async (event: { target: { value: string; name: string } }) => setCurrentValue(event.target.value);

  const removeItem = async (removeIndex: number) => {
    onChange(name, items.filter((_value, index) => index !== removeIndex));
  };

  const addItem = async () => {
    onChange(name, [...items, capitalize(currentValue)]);
    setCurrentValue(DEFAULT_CURRENT_VALUE);
  };

  const arraySection = (
    <>
      {!!items?.length && (
        <ScrollView height="inherit" width="inherit" maxHeight={"7rem"}>
          {items.map((value, index) => {
            return (
              <Badge
                key={index}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  marginRight: 3,
                  marginTop: 3
                }}
              >
                {value}
                <Icon
                  style={{
                    cursor: "pointer",
                    paddingLeft: 3,
                    width: 20,
                    height: 20,
                  }}
                  viewBox={{ width: 20, height: 20 }}
                  paths={[
                    {
                      d: "M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z",
                      stroke: "black",
                    },
                  ]}
                  ariaLabel="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(index);
                  }}
                />
              </Badge>
            );
          })}
        </ScrollView>
      )}
    </>
  );

  return (
    <>
      {!options &&
        <TextField
          required={required}
          fullWidth
          label={label}
          name={name}
          value={currentValue}
          onChange={onChangeCurrentValue}
        />
      }
      {!!options &&
        <FormControl fullWidth>
          <InputLabel required={required}>{label}</InputLabel>
          <Select
            fullWidth
            name={name}
            label={label}
            value={currentValue}
            onChange={onChangeCurrentValue}
          >
            {options.filter((opt) => !items.includes(opt)).map((opt: string) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      }
      <Button onClick={addItem} variant="text">
        Aggiugi
      </Button>
      {arraySection}
    </>
  );
}

export default ArrayField;
