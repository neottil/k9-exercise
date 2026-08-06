// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import type { ExercisesCreatedByUser } from "../interfaces/adminInterfaces";
import { apiFetch, apiError } from "./apiFetch";

const BASE_URL = "/api/admin/audit";

export const getExercisesCreatedByUser = async (from: string, to?: string): Promise<ExercisesCreatedByUser[]> => {
  const params = new URLSearchParams({ from });
  if (to) params.set("to", to);
  const res = await apiFetch(`${BASE_URL}/created-by-user?${params.toString()}`);
  if (!res.ok) throw await apiError(res, "Errore nel calcolo della classifica");
  return res.json();
};
