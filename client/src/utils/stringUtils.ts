// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

const capitalize = (value: string): string =>
    value.charAt(0).toUpperCase() + value.slice(1);

const isEmpty = (value: string): boolean =>
    !value || value.trim() === "";

export { capitalize, isEmpty };