export enum Role {
  USER = 'USER',
  ADVISOR = 'ADVISOR',
}

export type User = {
  id: string;
  email: string;
  role: Role;
};

export type UnassignedUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type Advisor = {
  id: string;
  email: string;
};

export type Client = {
  id: string;
  email: string;
  createdAt: string;
};