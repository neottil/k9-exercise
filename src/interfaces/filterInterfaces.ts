import { defaultBodyTarget, defaultWorkingArea } from "./exerciseInterfaces";

type OperationFilter = "eq" | "gt";

type StringOnChangeCallback = (name: string, value: string) => void

type NumberOnChangeCallback = (name: string, value: number) => void

type NumberWithOperationOnChangeCallback = (name: string, value: number, operation: OperationFilter) => void

type ResetCallBack = (name: string) => void;

interface ViewFilters {
  onChangeCallback: NumberWithOperationOnChangeCallback;
  resetCallback: ResetCallBack;
}

interface WorkingAreaViewFilters extends ViewFilters {
  value: WorkingAreaFilters;
}

interface BodyTargetViewFilters extends ViewFilters {
  value: BodyTargetFilters;
}

interface LevelSelectProps {
  value: number;
  name: string;
  label: string;
  onChangeCallback: NumberOnChangeCallback;
  resetCallback?: ResetCallBack;
  disableAdornment?: boolean;
  useZeroValue?: boolean;
}

interface LevelSelectWithOperationProps extends Omit<LevelSelectProps, 'value' | 'onChangeCallback'> {
  value: NumFilterWithOp;
  onChangeCallback: NumberWithOperationOnChangeCallback;
}

interface SelectTypeProps {
  onChangeCallback?: StringOnChangeCallback;
  disabled: boolean;
  value: string;
  required?: boolean;
}

interface NumFilterWithOp {
  value: number;
  operation: OperationFilter;
}

interface WorkingAreaFilters {
  mental: NumFilterWithOp;
  flexibility: NumFilterWithOp;
  strength: NumFilterWithOp;
  balance: NumFilterWithOp;
  cardio: NumFilterWithOp;
}

interface BodyTargetFilters {
  ant: NumFilterWithOp;
  post: NumFilterWithOp;
  core: NumFilterWithOp;
  backbone: NumFilterWithOp;
  fullBody: NumFilterWithOp;
}

interface Filters {
  workingArea: WorkingAreaFilters;
  bodyTarget: BodyTargetFilters;
}

const defaultFilters: Filters = {
  workingArea:  Object.keys(defaultWorkingArea).reduce(
    (acc, k) => {
      acc[k as keyof WorkingAreaFilters] = {
        value: defaultWorkingArea[k as keyof WorkingAreaFilters],
        operation: "gt",
      };
      return acc;
    },
    {} as WorkingAreaFilters
  ),
  bodyTarget:  Object.keys(defaultBodyTarget).reduce(
    (acc, k) => {
      acc[k as keyof BodyTargetFilters] = {
        value: defaultBodyTarget[k as keyof BodyTargetFilters],
        operation: "gt",
      };
      return acc;
    },
    {} as BodyTargetFilters
  )
}

export type {
  LevelSelectProps,
  LevelSelectWithOperationProps,
  SelectTypeProps,
  StringOnChangeCallback,
  NumberOnChangeCallback,
  NumberWithOperationOnChangeCallback,
  ResetCallBack,
  OperationFilter,
  ViewFilters,
  Filters,
  WorkingAreaViewFilters,
  BodyTargetViewFilters,
  WorkingAreaFilters,
  BodyTargetFilters,
  NumFilterWithOp,
}

export {
  defaultFilters
}