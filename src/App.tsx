import { useCallback, useEffect, useState } from "react";
import {
  withAuthenticator,
  WithAuthenticatorProps,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import { blue } from "@mui/material/colors";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";

import type { Schema } from "../amplify/data/resource";
import AppBar from "./components/AppBar";
import Footer from "./components/Footer";
import WorkingAreaFilters from "./components/filters/WorkingAreaFilters";
import BodyTargetFilters from "./components/filters/BodyTargetFilters";
import ExerciseTable from "./components/ExerciseTable";

const client = generateClient<Schema>();

interface Filters {
  workingAreaMental?: number;
  workingAreaFlex?: number;
  workingAreaStrength?: number;
  workingAreaBalance?: number;
  workingAreaCardio?: number;
  bodyTargetAnt?: number;
  bodyTargetPost?: number;
  bodyTargetCore?: number;
  bodyTargetBackbone?: number;
  bodyTargetFullbody?: number;
}

const theme = createTheme({
  palette: {
    primary: {
      light: blue["A100"],
      main: blue[500],
      dark: blue[800],
    },
    secondary: {
      main: blue[50],
    },
    contrastThreshold: 3,
    tonalOffset: 0.2,
  },
  typography: {
    fontFamily: [
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
  },
});

const App = ({ user, signOut }: WithAuthenticatorProps) => {
  const [exercises, setExercises] = useState<Array<Schema["Exercise"]["type"]>>(
    []
  );
  const [filteredExercises, setFilteredExercises] = useState<
    Array<Schema["Exercise"]["type"]>
  >([]);
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    client.models.Exercise.observeQuery().subscribe({
      next: (data) => {
        setExercises([...data.items]);
      },
    });
  }, []);

  const workingAreaMentalFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaMental ||
      exercise?.workingArea?.mental == filters.workingAreaMental,
    [filters.workingAreaMental]
  );
  const workingAreaFlexFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaFlex ||
      exercise?.workingArea?.flexibility == filters.workingAreaFlex,
    [filters.workingAreaFlex]
  );
  const workingAreaStrengthFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaStrength ||
      exercise?.workingArea?.strength == filters.workingAreaStrength,
    [filters.workingAreaStrength]
  );
  const workingAreaBalanceFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaBalance ||
      exercise?.workingArea?.balance == filters.workingAreaBalance,
    [filters.workingAreaBalance]
  );
  const workingAreaCardioFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaCardio ||
      exercise?.workingArea?.cardio == filters.workingAreaCardio,
    [filters.workingAreaCardio]
  );

  const bodyTargetAntFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.bodyTargetAnt ||
      exercise?.bodyTarget?.ant == filters.bodyTargetAnt,
    [filters.bodyTargetAnt]
  );
  const bodyTargetPostFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.bodyTargetPost ||
      exercise?.bodyTarget?.post == filters.bodyTargetPost,
    [filters.bodyTargetPost]
  );
  const bodyTargetCoreFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.bodyTargetCore ||
      exercise?.bodyTarget?.core == filters.bodyTargetCore,
    [filters.bodyTargetCore]
  );
  const bodyTargetBackboneFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.bodyTargetBackbone ||
      exercise?.bodyTarget?.backbone == filters.bodyTargetBackbone,
    [filters.bodyTargetBackbone]
  );
  const bodyTargetFullbodyFilter = useCallback(
    (exercise: Schema["Exercise"]["type"]) =>
      !filters.bodyTargetFullbody ||
      exercise?.bodyTarget?.fullBody == filters.bodyTargetFullbody,
    [filters.bodyTargetFullbody]
  );

  useEffect(() => {
    const filteredData = exercises
      .filter(workingAreaMentalFilter)
      .filter(workingAreaFlexFilter)
      .filter(workingAreaStrengthFilter)
      .filter(workingAreaBalanceFilter)
      .filter(workingAreaCardioFilter)
      .filter(bodyTargetAntFilter)
      .filter(bodyTargetPostFilter)
      .filter(bodyTargetCoreFilter)
      .filter(bodyTargetBackboneFilter)
      .filter(bodyTargetFullbodyFilter);

    setFilteredExercises(filteredData);
  }, [
    exercises,
    filters,
    workingAreaBalanceFilter,
    workingAreaCardioFilter,
    workingAreaFlexFilter,
    workingAreaMentalFilter,
    workingAreaStrengthFilter,
  ]);

  /*
  const createExercise = (user: AuthUser | undefined) => {
    client.models.Exercise.create({
      id: uuidv4(),
      description: window.prompt("Description"),
      type: window.prompt("Type") || "default",
      workingArea,
      user: user?.signInDetails?.loginId,
    });
  };
  */

  const onChangeFilter = (name: string, value: string) => {
    setFilters({ ...filters, [name]: value });
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar user={user} signOut={signOut} />
      <Box sx={{ m: "0.7em" }}>
        <Box sx={{ display: { xs:"block", md: "flex"}}}>
          <WorkingAreaFilters onChangeCallback={onChangeFilter} />
          <BodyTargetFilters onChangeCallback={onChangeFilter} />
        </Box>
        <ExerciseTable rows={filteredExercises} />
      </Box>
      <Footer />
    </ThemeProvider>
  );
};

const withAuthApp = withAuthenticator(App);

export default withAuthApp;
