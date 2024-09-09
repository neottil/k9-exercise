import { useEffect, useState } from "react";
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
import ExerciseTable from "./components/ExerciseTable";

const client = generateClient<Schema>();

interface Filters {
  workingAreaMental?: number;
  workingAreaFlex?: number;
  workingAreaStrength?: number;
  workingAreaBalance?: number;
  workingAreaCardio?: number;
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

    const workingAreaMentalFilter = (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaMental ||
      exercise?.workingArea?.mental == filters.workingAreaMental;
    const workingAreaFlexFilter = (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaFlex ||
      exercise?.workingArea?.flexibility == filters.workingAreaFlex;
    const workingAreaStrengthFilter = (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaStrength ||
      exercise?.workingArea?.strength == filters.workingAreaStrength;
    const workingAreaBalanceFilter = (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaBalance ||
      exercise?.workingArea?.balance == filters.workingAreaBalance;
    const workingAreaCardioFilter = (exercise: Schema["Exercise"]["type"]) =>
      !filters.workingAreaCardio ||
    exercise?.workingArea?.cardio == filters.workingAreaCardio;
  
  useEffect(() => {

    const filteredData = exercises
      .filter(workingAreaMentalFilter)
      .filter(workingAreaFlexFilter)
      .filter(workingAreaStrengthFilter)
      .filter(workingAreaBalanceFilter)
      .filter(workingAreaCardioFilter);
    
    setFilteredExercises(filteredData);
  }, [exercises, filters]);

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
      <Box sx={{m: "0.7em"}}>
        <WorkingAreaFilters onChangeCallback={onChangeFilter} />
        <ExerciseTable rows={filteredExercises} />
      </Box>
      <Footer />
    </ThemeProvider>
  );
};

const withAuthApp = withAuthenticator(App);

export default withAuthApp;
