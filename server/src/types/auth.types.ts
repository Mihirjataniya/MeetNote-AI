export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    createdAt?: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  displayName: string;
}
