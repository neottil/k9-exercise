declare module "password-validator" {
  class PasswordValidator {
    is(): this;
    has(): this;
    not(): this;
    min(num: number): this;
    max(num: number): this;
    uppercase(num?: number): this;
    lowercase(num?: number): this;
    digits(num?: number): this;
    symbols(num?: number): this;
    spaces(num?: number): this;
    letters(num?: number): this;
    validate(password: string): boolean;
    validate(password: string, options: { list: true }): string[];
  }
  export = PasswordValidator;
}
