// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { GridFilterModel, GridSortModel } from "@mui/x-data-grid";

import {
  Filters,
  defaultFilters,
  NumberWithOperationOnChangeCallback,
  ResetCallBack,
} from "../interfaces/filterInterfaces";
import { deepCopy } from "../utils/objectUtils";

// Stato interno del DataGrid (filtri colonne + ordinamento)
interface DataGridState {
  filterModel: GridFilterModel;
  sortModel: GridSortModel;
}

const defaultDataGridState: DataGridState = {
  filterModel: { items: [] },
  sortModel: [],
};

interface FiltersContextValue {
  // Filtri WorkingArea / BodyTarget (usati per la query al backend)
  filters: Filters;
  updateFilter: NumberWithOperationOnChangeCallback;
  resetFilter: ResetCallBack;
  // Stato interno del DataGrid (filtri colonne, ordinamento)
  dataGridState: DataGridState;
  setDataGridFilterModel: (model: GridFilterModel) => void;
  setDataGridSortModel: (model: GridSortModel) => void;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export const FiltersProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Filters>(deepCopy(defaultFilters));
  const [dataGridState, setDataGridStateRaw] = useState<DataGridState>(defaultDataGridState);

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

  const setDataGridFilterModel = useCallback((model: GridFilterModel) => {
    setDataGridStateRaw((prev) => ({ ...prev, filterModel: model }));
  }, []);

  const setDataGridSortModel = useCallback((model: GridSortModel) => {
    setDataGridStateRaw((prev) => ({ ...prev, sortModel: model }));
  }, []);

  return (
    <FiltersContext.Provider
      value={{
        filters,
        updateFilter,
        resetFilter,
        dataGridState,
        setDataGridFilterModel,
        setDataGridSortModel,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = (): FiltersContextValue => {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters deve essere usato dentro FiltersProvider");
  return ctx;
};
