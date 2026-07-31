export interface LoginData {
  email_or_username: string;
  password: string;
}

export interface RegisterData {
  fname: string;
  lname: string;
  mname?: string;
  uname: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
}

export interface Invite {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  inviterId?: string;
  status: string;
  roleIds?: string[];
}

export interface RegisterFormData {
  email: string;
  fname: string;
  mname?: string;
  lname: string;
  uname: string;
  password: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface AuthResponse {
  token: string;
  user: User;
}