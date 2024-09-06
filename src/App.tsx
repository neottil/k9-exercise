import { useEffect, useState } from "react";
import {
  withAuthenticator,
  WithAuthenticatorProps,
} from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { AuthUser } from "aws-amplify/auth";
import { v4 as uuidv4 } from 'uuid';
import { blue } from "@mui/material/colors";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import type { Schema } from "../amplify/data/resource";
import AppBar from "./components/AppBar";
import TypeSelect from "./components/filters/TypeSelect";
import ExerciseTable from "./components/ExerciseTable";
import "@aws-amplify/ui-react/styles.css";

const client = generateClient<Schema>();

interface Filters {
  type?: string;
}

const theme = createTheme({
  palette: {
    primary: {
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

  useEffect(() => {
    const typeFilter = (exercise: Schema["Exercise"]["type"]) =>
      !filters.type || exercise.type == filters.type;

    const filteredData = exercises.filter(typeFilter);
    setFilteredExercises(filteredData);
  }, [exercises, filters]);

  const workingArea = {
    mental: 5,
    flexibility: 3,
    strength: 1,
    balance: 1,
    cardio: 0,
  };

  const createExercise = (user: AuthUser | undefined) => {
    client.models.Exercise.create({
      id: uuidv4(),
      description: window.prompt("Description"),
      type: window.prompt("Type") || "default",
      workingArea,
      user: user?.signInDetails?.loginId,
    });
  };

  const onChangeFilter = (name: string, value: string) => {
    setFilters({ ...filters, [name]: value });
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar user={user} signOut={signOut} />
      <TypeSelect onChangeCallback={onChangeFilter} />
      <ExerciseTable rows={exercises} />
      <button onClick={() => createExercise(user)}>Create</button>
    </ThemeProvider>
  );
};

const withAuthApp = withAuthenticator(App);

export default withAuthApp;
