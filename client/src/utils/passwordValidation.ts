// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import PasswordValidator from "password-validator";

const schema = new PasswordValidator();
schema
  .is().min(8)
  .has().uppercase()
  .has().lowercase()
  .has().digits(1)
  .has().symbols(1)
  .has().not().spaces();

export interface PasswordRules {
  minLength:    boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit:     boolean;
  hasSymbol:    boolean;
}

export const checkPasswordRules = (password: string): PasswordRules => {
  const failed = schema.validate(password, { list: true });
  return {
    minLength:    !failed.includes("min"),
    hasUppercase: !failed.includes("uppercase"),
    hasLowercase: !failed.includes("lowercase"),
    hasDigit:     !failed.includes("digits"),
    hasSymbol:    !failed.includes("symbols"),
  };
};

export const isPasswordValid = (rules: PasswordRules): boolean =>
  Object.values(rules).every(Boolean);

export const PASSWORD_RULE_LABELS: Record<keyof PasswordRules, string> = {
  minLength:    "Almeno 8 caratteri",
  hasUppercase: "Almeno una lettera maiuscola",
  hasLowercase: "Almeno una lettera minuscola",
  hasDigit:     "Almeno un numero",
  hasSymbol:    "Almeno un simbolo (es. ! @ # $ % & *)",
};
