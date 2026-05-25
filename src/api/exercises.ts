import { Exercise } from "../interfaces/exerciseInterfaces";

const BASE_URL = "/api/exercises";

export const listExercises = async (): Promise<Exercise[]> => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Errore nel recupero degli esercizi");
  return res.json();
};

export const getExercise = async (id: string): Promise<Exercise> => {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Errore nel recupero dell'esercizio con id: ${id}`);
  return res.json();
};

export const createExercise = async (exercise: Exercise): Promise<Exercise> => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) throw new Error("Errore nel salvataggio dell'esercizio");
  return res.json();
};

export const updateExercise = async (id: string, exercise: Exercise): Promise<Exercise> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) throw new Error("Errore nell'aggiornamento dell'esercizio");
  return res.json();
};

export const listExerciseTypes = async (): Promise<string[]> => {
  const res = await fetch(`${BASE_URL}/types`);
  if (!res.ok) throw new Error("Errore nel recupero dei tipi");
  return res.json();
};
