import { isEmpty } from "../../utils/stringUtils";
import { Exercise } from "../../interfaces/exerciseInterfaces";

// The validation function must return Error or null

const validateType = (type: string): Error | null => {
  if (isEmpty(type)) {
    return {
      name: "Tipologia",
      message: "La tipologia di esercizio è obbligatoria.",
    };
  }
  return null;
};

const validateDescription = (desc: string): Error | null => {
  if (isEmpty(desc)) {
    return {
      name: "Descrizione",
      message: "La descrizione dell'esercizio è obbligatoria.",
    };
  }
  return null;
};

const validateSetup = (setup: string): Error | null => {
  if (isEmpty(setup)) {
    return {
      name: "Setup",
      message: "La descrizione del setup è obbligatoria.",
    };
  }
  return null;
};

const validateMovementPlan = (plans: string[]): Error | null => {
  if (plans.length === 0) {
    return {
      name: "Piano di movimento",
      message: "E' obbligatorio almeno un piano di movimento",
    };
  }
  return null;
};

export const validate = (exerciseToSave: Exercise): Error[] => {
  const errors: (Error | null)[] = [
    validateType(exerciseToSave.type),
    validateDescription(exerciseToSave.description),
    validateSetup(exerciseToSave.setup),
    validateMovementPlan(exerciseToSave.movementPlan)
  ]
  return errors.filter(err => err !== null);
};