import { Employee, Department, Position, Client, Project, EmployeeProject, LLMRequest, PromptRequest } from "./types";
// src/lib/api.ts
// Utility functions to fetch all backend endpoints

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// LLM/Agent Endpoints
export async function postLLM(data: LLMRequest) {
  const res = await fetch(`${BASE_URL}/api/llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const contentType = res.headers.get("content-type");
  let parsed;
  if (contentType && contentType.includes("application/json")) {
    parsed = await res.json();
  } else {
    const text = await res.text();
    throw new Error("Expected JSON, got: " + text);
  }
  if (!res.ok) {
    throw new Error(typeof parsed === "string" ? parsed : JSON.stringify(parsed));
  }
  return parsed;
}

export async function postPrompt(data: PromptRequest) {
  return fetch(`${BASE_URL}/api/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

// Migration/Seeding Endpoints
export async function postMigrateAll() {
  return fetch(`${BASE_URL}/api/migrate/all`, { method: "POST" }).then((res) => res.json());
}
export async function postMigrateEmployees() {
  return fetch(`${BASE_URL}/api/migrate/employees`, { method: "POST" }).then((res) => res.json());
}

// Employee Management
export async function getEmployees() {
  return fetch(`${BASE_URL}/api/employees`).then((res) => res.json());
}
export async function getEmployeeById(id: string) {
  return fetch(`${BASE_URL}/api/employees?id=${id}`).then((res) => res.json());
}
export async function postEmployee(data: Employee) {
  const res = await fetch(`${BASE_URL}/api/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const contentType = res.headers.get("content-type");
  let parsed;
  if (contentType && contentType.includes("application/json")) {
    parsed = await res.json();
  } else {
    const text = await res.text();
    throw new Error("Expected JSON, got: " + text);
  }
  if (!res.ok) {
    throw new Error(typeof parsed === "string" ? parsed : JSON.stringify(parsed));
  }
  return parsed;
}
export async function putEmployee(data: Employee) {
  return fetch(`${BASE_URL}/api/employees`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function deleteEmployee(id: string) {
  return fetch(`${BASE_URL}/api/employees?id=${id}`, { method: "DELETE" }).then((res) => res.json());
}

// Department Management
export async function getDepartments() {
  return fetch(`${BASE_URL}/api/departments`).then((res) => res.json());
}
export async function getDepartmentById(id: string) {
  return fetch(`${BASE_URL}/api/departments?id=${id}`).then((res) => res.json());
}
export async function postDepartment(data: Department) {
  return fetch(`${BASE_URL}/api/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function putDepartment(data: Department) {
  return fetch(`${BASE_URL}/api/departments`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function deleteDepartment(id: string) {
  return fetch(`${BASE_URL}/api/departments?id=${id}`, { method: "DELETE" }).then((res) => res.json());
}

// Position Management
export async function getPositions() {
  return fetch(`${BASE_URL}/api/positions`).then((res) => res.json());
}
export async function getPositionById(id: string) {
  return fetch(`${BASE_URL}/api/positions?id=${id}`).then((res) => res.json());
}
export async function postPosition(data: Position) {
  return fetch(`${BASE_URL}/api/positions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function putPosition(data: Position) {
  return fetch(`${BASE_URL}/api/positions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function deletePosition(id: string) {
  return fetch(`${BASE_URL}/api/positions?id=${id}`, { method: "DELETE" }).then((res) => res.json());
}

// Client Management
export async function getClients() {
  return fetch(`${BASE_URL}/api/clients`).then((res) => res.json());
}
export async function getClientById(id: string) {
  return fetch(`${BASE_URL}/api/clients?id=${id}`).then((res) => res.json());
}
export async function postClient(data: Client) {
  return fetch(`${BASE_URL}/api/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function putClient(data: Client) {
  return fetch(`${BASE_URL}/api/clients`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function deleteClient(id: string) {
  return fetch(`${BASE_URL}/api/clients?id=${id}`, { method: "DELETE" }).then((res) => res.json());
}

// Project Management
export async function getProjects() {
  return fetch(`${BASE_URL}/api/projects`).then((res) => res.json());
}
export async function getProjectById(id: string) {
  return fetch(`${BASE_URL}/api/projects?id=${id}`).then((res) => res.json());
}
export async function postProject(data: Project) {
  return fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function putProject(data: Project) {
  return fetch(`${BASE_URL}/api/projects`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function deleteProject(id: string) {
  return fetch(`${BASE_URL}/api/projects?id=${id}`, { method: "DELETE" }).then((res) => res.json());
}

// Employee-Project Assignment
export async function getEmployeeProjects() {
  return fetch(`${BASE_URL}/api/employee_projects`).then((res) => res.json());
}
export async function getEmployeeProjectByIds(employee_id: string, project_id: string) {
  return fetch(`${BASE_URL}/api/employee_projects?employee_id=${employee_id}&project_id=${project_id}`).then((res) => res.json());
}
export async function postEmployeeProject(data: EmployeeProject) {
  return fetch(`${BASE_URL}/api/employee_projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function putEmployeeProject(data: EmployeeProject) {
  return fetch(`${BASE_URL}/api/employee_projects`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function deleteEmployeeProject(employee_id: string, project_id: string) {
  return fetch(`${BASE_URL}/api/employee_projects?employee_id=${employee_id}&project_id=${project_id}`, { method: "DELETE" }).then((res) => res.json());
}
