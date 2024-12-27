import React, { useState } from "react";
import { Badge, Divider, Icon, ScrollView } from "@aws-amplify/ui-react";
import { Box, Button, TextField } from "@mui/material";
import { OnChangeCallback } from "../../interfaces/filterInterfaces";
import { capitalize } from "../../functions/stringUtils";


interface ArrayFieldProps {items: string[], onChange: OnChangeCallback, label: string, name: string};

const ArrayField = ({
  items,
  onChange,
  label,
  name,
}: ArrayFieldProps) => {
  const DEFAULT_CURRENT_VALUE = "";
  const [currentValue, setCurrentValue] = useState<string>(DEFAULT_CURRENT_VALUE);
  const [selectedBadgeIndex, setSelectedBadgeIndex] = React.useState();
  
  const onChangeCurrentValue = async (event: React.ChangeEvent<any>) => setCurrentValue(event.target.value);
  
  const removeItem = async (removeIndex: number) => {
    onChange(name, items.filter((_value, index) => index !== removeIndex));
  };

  const addItem = async () => {
    onChange(name, [...items, capitalize(currentValue)]);
    setCurrentValue(DEFAULT_CURRENT_VALUE);
  };

  const onClickBadge = async () => {
    console.log("onClickBadge");
  };

  const arraySection = (
    <React.Fragment>
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
                  marginTop: 3,
                  backgroundColor:
                    index === selectedBadgeIndex ? "#B8CEF9" : "",
                }}
                onClick={onClickBadge}
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
      <Divider orientation="horizontal" marginTop={5} />
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <TextField
        fullWidth
        label={label}
        name={name}
        value={currentValue}
        onChange={onChangeCurrentValue}
      />
      <Box justifyContent="flex-end">
        <Button
          children="Cancella"
          type="button"
          size="small"
          onClick={() => {
            setCurrentValue(DEFAULT_CURRENT_VALUE);
            setSelectedBadgeIndex(undefined);
          }}
        />
        <Button onClick={addItem}>
          {selectedBadgeIndex !== undefined ? "Salva" : "Aggiugi"}
        </Button>
      </Box>
      {arraySection}
    </React.Fragment>
  );
}

export default ArrayField;
