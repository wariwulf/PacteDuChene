export interface RegisterInput {
  email: string;
  password: string;
  username: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
}

export interface AuthSessionResult {
  user: AuthenticatedUser;
  sessionToken: string;
  expiresAt: Date;
}