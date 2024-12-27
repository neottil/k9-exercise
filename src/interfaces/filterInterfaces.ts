type OnChangeCallback = (name: string, value: any, operation?: "eq" | "gt") => void

interface SimpleFiltersProps {
  onChangeCallback?: OnChangeCallback;
}

interface SelectFieldProps extends SimpleFiltersProps {
  name: string;
  label: string;
}

interface SelectTypeProps extends SimpleFiltersProps {
  disabled: boolean;
  value: string;
}

interface NumFilterWithOp {
  value: number;
  operation: "eq" | "gt";
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
  Filters,
  NumFilterWithOp,
}