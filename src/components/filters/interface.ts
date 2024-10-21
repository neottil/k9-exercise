type OnChangeCallback = (name: string, value: string, operation: string) => void

interface TableFiltersProps {
  onChangeCallback?: OnChangeCallback;
}

interface NumFilter {
  value: number;
  operation: "eq" | "gt";
}

interface Filters {
  workingArea?: {
    mental?: NumFilter;
    flexibility?: NumFilter;
    strength?: NumFilter;
    balance?: NumFilter;
    cardio?: NumFilter;
  };
  bodyTarget?: {
    ant?: NumFilter;
    post?: NumFilter;
    core?: NumFilter;
    backbone?: NumFilter;
    fullbody?: NumFilter;
  }
}

export type {
  TableFiltersProps,
  OnChangeCallback,
  Filters,
  NumFilter
}