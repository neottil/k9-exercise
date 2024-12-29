type OperationFilter = "eq" | "gt";

type OnChangeCallback = (name: string, value: any, operation?: OperationFilter) => void

interface SimpleFiltersProps {
  onChangeCallback?: OnChangeCallback;
}

interface SelectFieldProps extends SimpleFiltersProps {
  name: string;
  label: string;
  resetCallback?: () => void; 
  disableAdornment?: boolean;
}

interface SelectTypeProps extends SimpleFiltersProps {
  disabled: boolean;
  value: string;
}

interface NumFilterWithOp {
  value: number;
  operation: OperationFilter;
}

interface Filters {
  workingArea?: {
    mental?: NumFilterWithOp;
    flexibility?: NumFilterWithOp;
    strength?: NumFilterWithOp;
    balance?: NumFilterWithOp;
    cardio?: NumFilterWithOp;
  };
  bodyTarget?: {
    ant?: NumFilterWithOp;
    post?: NumFilterWithOp;
    core?: NumFilterWithOp;
    backbone?: NumFilterWithOp;
    fullbody?: NumFilterWithOp;
  }
}

export type {
  SimpleFiltersProps,
  SelectFieldProps,
  SelectTypeProps,
  OnChangeCallback,
  OperationFilter,
  Filters,
  NumFilterWithOp,
}