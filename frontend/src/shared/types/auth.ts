export type UserRole = "PATIENT" | "DOCTOR";

export type AuthUser = {
  id: string;
  login: string;
  role: UserRole;
  is_active?: boolean;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};
