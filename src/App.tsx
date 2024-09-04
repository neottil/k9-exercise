import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { v4 as uuidv4 } from 'uuid';

import TypeSelect from "./filters/TypeSelect";

import "@aws-amplify/ui-react/styles.css";

const client = generateClient<Schema>();

const App = () => {
  const [exercises, setExercises] = useState<Array<Schema["Exercise"]["type"]>>([]);

  useEffect(() => {
    client.models.Exercise.observeQuery().subscribe({
      next: (data) => setExercises([...data.items]),
    });
  }, []);
  

  const workingArea = {
    mental: 5,
    flexibility: 3,
    strength: 1,
    balance: 1,
    cardio: 0
  }

  const createExercise = () => {
    client.models.Exercise.create({ id: uuidv4(), description: window.prompt("Description"), type: window.prompt("Type"), workingArea });
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <TypeSelect />
          <div>{JSON.stringify(user)}</div>
          <button onClick={createExercise}>+ new</button>
          <ul>
            {exercises.map((exercise) => (
              <li key={exercise.id}>
                {JSON.stringify(exercise)}
              </li>
            ))}
          </ul>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
