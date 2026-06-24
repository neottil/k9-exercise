// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { isEmpty } from "../../utils/stringUtils";
import { Exercise } from "../../interfaces/exerciseInterfaces";

// The validation function must return Error or null

const validateType = (type: string): Error | null =>
  isEmpty(type)
    ? ({
      name: "Tipologia",
      message: "La tipologia di esercizio è obbligatoria.",
    })
    : null;

const validateDescription = (desc: string): Error | null =>
  isEmpty(desc)
    ? ({
      name: "Descrizione",
      message: "La descrizione dell'esercizio è obbligatoria.",
    })
    : null;

const validateSetup = (tools: string[], setup: string): Error | null =>
  tools.length > 0 && isEmpty(setup)
    ? ({
      name: "Setup",
      message: "La descrizione del setup è obbligatoria quando sono presenti degli attrezzi.",
    })
    : null;

const validateMovementPlan = (plans: string[]): Error | null =>
  plans.length === 0
    ? ({
      name: "Piano di movimento",
      message: "E' obbligatorio almeno un piano di movimento",
    })
    : null;

const validateInstructorLevel = (level: string): Error | null =>
  level !== "BSS" && level !== "CTS"
    ? ({ name: "Livello", message: "Seleziona il livello dell'esercizio (BSS o CTS)." })
    : null;

export const validate = (exerciseToSave: Exercise): Error[] => {
  const errors: (Error | null)[] = [
    validateInstructorLevel(exerciseToSave.instructorLevel),
    validateType(exerciseToSave.type),
    validateDescription(exerciseToSave.description),
    validateSetup(exerciseToSave.tools, exerciseToSave.setup),
    validateMovementPlan(exerciseToSave.movementPlan)
  ]
  return errors.filter(err => err !== null);
};