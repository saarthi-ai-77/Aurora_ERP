import { Role } from '../enums';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface LoginResponseData {
  user: AuthUser;
}
