export type UserRole = "viewer" | "admin";

export interface AuthUser {
  email: string;
  role: UserRole;
}
