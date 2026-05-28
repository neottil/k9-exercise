import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

import {
  Filters,
  defaultFilters,
  NumberWithOperationOnChangeCallback,
  ResetCallBack,
} from "../interfaces/filterInterfaces";
import { deepCopy } from "../utils/objectUtils";

interface FiltersContextValue {
  filters: Filters;
  updateFilter: NumberWithOperationOnChangeCallback;
  resetFilter: ResetCallBack;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export const FiltersProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Filters>(deepCopy(defaultFilters));

  const updateFilter: NumberWithOperationOnChangeCallback = useCallback(
    (name, value, operation) => {
      setFilters((prevState) => {
        const updatedState = { ...prevState };
        const keys = name.split(".");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let temp: any = updatedState;
        for (let i = 0; i < keys.length - 1; i++) {
          temp = temp[keys[i]];
        }
        temp[keys[keys.length - 1]] = { value, operation };

        return updatedState;
      });
    },
    []
  );

  const resetFilter: ResetCallBack = useCallback(
    (name) => {
      const keys = name.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let defaultValue: any = defaultFilters;
      for (const key of keys) {
        defaultValue = defaultValue[key];
      }
      updateFilter(name, defaultValue.value, defaultValue.operation);
    },
    [updateFilter]
  );

  return (
    <FiltersContext.Provider value={{ filters, updateFilter, resetFilter }}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = (): FiltersContextValue => {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters deve essere usato dentro FiltersProvider");
  return ctx;
};
