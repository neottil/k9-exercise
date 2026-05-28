import { Exercise } from "../interfaces/exerciseInterfaces";
import { Filters, NumFilterWithOp, WorkingAreaFilters, BodyTargetFilters } from "../interfaces/filterInterfaces";

const BASE_URL = "/api/exercises";

/**
 * Serializza un gruppo di filtri in URLSearchParams.
 * Aggiunge solo i filtri con value > 0.
 *
 * Esempio output: workingArea.mental.value=3&workingArea.mental.operation=gt
 */
const appendFilterGroup = (
  prefix: string,
  group: WorkingAreaFilters | BodyTargetFilters,
  params: URLSearchParams
) => {
  for (const [key, filter] of Object.entries(group) as [string, NumFilterWithOp][]) {
    if (filter.value > 0) {
      params.set(`${prefix}.${key}.value`, String(filter.value));
      params.set(`${prefix}.${key}.operation`, filter.operation);
    }
  }
};

export const listExercises = async (filters?: Filters): Promise<Exercise[]> => {
  const params = new URLSearchParams();

  if (filters) {
    appendFilterGroup("workingArea", filters.workingArea, params);
    appendFilterGroup("bodyTarget", filters.bodyTarget, params);
  }

  const query = params.toString();
  const res = await fetch(`${BASE_URL}${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Errore nel recupero degli esercizi");
  return res.json();
};

export const getExercise = async (id: string): Promise<Exercise> => {
  const res = await fetch(`${BASE_URL}/${id}/changes`);
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
