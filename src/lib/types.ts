// src/lib/types.ts


export interface Employee {
  id?: string;
  name: string;
  department_id: number;
  position_id: number;
  client_id: number;
}

export interface Department {
  id?: string;
  name: string;
}

export interface Position {
  id?: string;
  name: string;
}

export interface Client {
  id?: string;
  name: string;
}

export interface Project {
  id?: string;
  name: string;
  client_id: string;
}

export interface EmployeeProject {
  employee_id: string;
  project_id: string;
}

export interface LLMRequest {
  prompt: string;
}

export interface PromptRequest {
  prompt: string;
}
