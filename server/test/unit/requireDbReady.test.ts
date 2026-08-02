// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { requireDbReady } from "../../src/middleware/requireDbReady.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("requireDbReady", () => {
  // Questo file di test non chiama mai mongoose.connect(): la connessione di
  // default resta "disconnected" (readyState 0), esattamente lo stato che il
  // middleware deve intercettare — senza bisogno di mockare mongoose.
  it("risponde 503 se la connessione al DB non è pronta", () => {
    const req = { method: "POST", originalUrl: "/api/exercises" } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireDbReady(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });
});
