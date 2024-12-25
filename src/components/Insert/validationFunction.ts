import { isEmpty } from "../../functions/stringUtils";
import { Exercise } from "../../interfaces/exerciseInterfaces";

// The validation function must return Error or null

const validateType = (type: string): Error | null => {
  if (isEmpty(type)) {
    return {
      name: "type",
      message: "La tipologia di esercizio è obbligatoria.",
    };
  }
  return null;
};

export const validate = (exerciseToSave: Exercise): Error[] => {
  const errors: (Error | null)[] = [
    validateType(exerciseToSave.type)
  ]
  return errors.filter(err => err !== null);
}