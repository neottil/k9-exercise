// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export {
  deepCopy
}