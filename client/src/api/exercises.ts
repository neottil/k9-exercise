// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Exercise } from "../interfaces/exerciseInterfaces";
import type { NewExercise, PendingItem } from "../interfaces/adminInterfaces";
import { Filters, NumFilterWithOp, WorkingAreaFilters, BodyTargetFilters } from "../interfaces/filterInterfaces";
import { apiFetch, apiError } from "./apiFetch";

const BASE_URL = "/api/exercises";

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
  const res = await apiFetch(`${BASE_URL}${query ? `?${query}` : ""}`);
  if (!res.ok) throw await apiError(res, "Errore nel recupero degli esercizi");
  return res.json();
};

export const getExercise = async (id: string): Promise<Exercise> => {
  const res = await apiFetch(`${BASE_URL}/${id}/changes`);
  if (!res.ok) throw await apiError(res, `Errore nel recupero dell'esercizio con id: ${id}`);
  return res.json();
};

export const createExercise = async (exercise: Exercise): Promise<Exercise> => {
  const res = await apiFetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) throw await apiError(res, "Errore nel salvataggio dell'esercizio");
  return res.json();
};

export const updateExercise = async (id: string, exercise: Exercise): Promise<Exercise> => {
  const res = await apiFetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) throw await apiError(res, "Errore nell'aggiornamento dell'esercizio");
  return res.json();
};

export const listExerciseTypes = async (): Promise<string[]> => {
  const res = await apiFetch(`${BASE_URL}/types`);
  if (!res.ok) throw await apiError(res, "Errore nel recupero dei tipi");
  return res.json();
};

export const getPending = async (): Promise<PendingItem[]> => {
  const res = await apiFetch(`${BASE_URL}/pending`);
  if (!res.ok) throw await apiError(res, "Errore nel caricamento delle modifiche in attesa");
  return res.json();
};

export const approveChange = async (id: string, fieldsToApply: Record<string, unknown>): Promise<void> => {
  const res = await apiFetch(`${BASE_URL}/${id}/approve-change`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fieldsToApply }),
  });
  if (!res.ok) throw await apiError(res, "Errore nell'approvazione");
};

export const rejectChange = async (id: string): Promise<void> => {
  const res = await apiFetch(`${BASE_URL}/${id}/reject-change`, { method: "POST" });
  if (!res.ok) throw await apiError(res, "Errore nel rifiuto");
};

export const getNewExercises = async (): Promise<NewExercise[]> => {
  const res = await apiFetch(`${BASE_URL}/to-approve`);
  if (!res.ok) throw await apiError(res, "Errore nel caricamento dei nuovi esercizi");
  return res.json();
};

export const approveExercise = async (id: string, exercise: Exercise): Promise<void> => {
  const res = await apiFetch(`${BASE_URL}/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) throw await apiError(res, "Errore nell'approvazione");
};

export const rejectExercise = async (id: string): Promise<void> => {
  const res = await apiFetch(`${BASE_URL}/${id}/reject`, { method: "POST" });
  if (!res.ok) throw await apiError(res, "Errore nel rifiuto");
};
