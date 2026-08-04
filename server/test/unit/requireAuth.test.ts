// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { requireAuth } from "../../src/middleware/requireAuth.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("requireAuth", () => {
  it("risponde 401 se manca la sessione", () => {
    const req = { session: {} } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("popola req.user dalla sessione e chiama next()", () => {
    const sessionUser = { email: "a@b.it", role: "viewer" };
    const req = { session: { user: sessionUser } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(req.user).toEqual(sessionUser);
    expect(next).toHaveBeenCalledOnce();
  });
});
