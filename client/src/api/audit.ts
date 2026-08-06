// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import type { ExercisesCreatedByUser, ChangesProposedByUser } from "../interfaces/adminInterfaces";
import { apiFetch, apiError } from "./apiFetch";

const BASE_URL = "/api/admin/audit";

const dateRangeQuery = (from: string, to?: string): string => {
  const params = new URLSearchParams({ from });
  if (to) params.set("to", to);
  return params.toString();
};

export const getExercisesCreatedByUser = async (from: string, to?: string): Promise<ExercisesCreatedByUser[]> => {
  const res = await apiFetch(`${BASE_URL}/created-by-user?${dateRangeQuery(from, to)}`);
  if (!res.ok) throw await apiError(res, "Errore nel calcolo della classifica");
  return res.json();
};

export const getChangesProposedByUser = async (from: string, to?: string): Promise<ChangesProposedByUser[]> => {
  const res = await apiFetch(`${BASE_URL}/changes-by-user?${dateRangeQuery(from, to)}`);
  if (!res.ok) throw await apiError(res, "Errore nel calcolo della classifica");
  return res.json();
};
