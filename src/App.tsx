import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { v4 as uuidv4 } from 'uuid';

import TypeSelect from "./filters/TypeSelect";

import "@aws-amplify/ui-react/styles.css";
import { AuthUser } from "aws-amplify/auth";

const client = generateClient<Schema>();

interface Filters {
  type?: string;
}

const App = () => {
  const [exercises, setExercises] = useState<Array<Schema["Exercise"]["type"]>>(
    []
  );
  const [FilteredExercises, setFilteredExercises] = useState<
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
    cardio: 0
  }

  const createExercise = (user: AuthUser | undefined) => {
    client.models.Exercise.create({ id: uuidv4(), description: window.prompt("Description"), type: window.prompt("Type") || "default", workingArea, user: user?.signInDetails?.loginId });
  }

  const onChangeFilter = (name: string, value: string) => {
    setFilters({ ...filters, [name]: value });
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <TypeSelect onChangeCallback={onChangeFilter} />
          <div>{JSON.stringify(filters)}</div>
          <ul>
            {FilteredExercises.map((exercise) => (
              <li key={exercise.id}>{JSON.stringify(exercise)}</li>
            ))}
          </ul>
          <button onClick={signOut}>Sign out</button>
          <button onClick={() => createExercise(user)}>Create</button>
        </main>
      )}
    </Authenticator>
  );
};

export default App;
