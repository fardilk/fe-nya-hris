import { Employee, Department, Position, Client, Project, EmployeeProject, LLMRequest, PromptRequest, DutyAssignment, LLMResponse, ClientVisitReport, AvailabilitySummary, UnavailableReportItem } from "./types";
// src/lib/api.ts
// Utility functions to fetch all backend endpoints

const BASE_URL = (() => {
  const defaultUrl = "http://localhost:8000";
  // On the server (Node) explicitly load dotenv from the appropriate file so env vars
  // are available at runtime during SSR/CLI scripts. Do NOT load dotenv in the browser.
  if (typeof window === "undefined") {
    try {
      // load only on server to avoid bundling dotenv into client code
  // use an indirect require so bundlers/linters don't inline/flag it
  const req: NodeRequire = Function('return require')();
      const dotenv = req('dotenv');
      const envPath = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.local';
      dotenv.config({ path: envPath });
    } catch {
      // ignore — if dotenv isn't available in the runtime env that's fine
    }
    return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || defaultUrl;
  }
  // In the browser, NEXT_PUBLIC_* vars must be inlined at build time
  return (process.env.NEXT_PUBLIC_API_URL as string) || defaultUrl;
})();

// LLM/Agent Endpoints
export async function postLLM(data: LLMRequest): Promise<LLMResponse> {
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
  return parsed as LLMResponse;
}

export async function getAvailability(params: { start_date: string; end_date: string; department_id?: string | number; position_id?: string | number; show_assignments?: number | boolean }) {
  const q = new URLSearchParams();
  q.set("start_date", params.start_date);
  q.set("end_date", params.end_date);
  if (params?.department_id !== undefined && params.department_id !== "") q.set("department_id", String(params.department_id));
  if (params?.position_id !== undefined && params.position_id !== "") q.set("position_id", String(params.position_id));
  if (params?.show_assignments !== undefined) q.set("show_assignments", String(params.show_assignments));
  const url = `${BASE_URL}/api/availability?${q.toString()}`;
  return fetch(url, { cache: 'no-store' }).then((res) => res.json()) as Promise<unknown>;
}

export async function getAvailabilitySummary(params: { start_date: string; end_date?: string }) {
  const q = new URLSearchParams();
  q.set("start_date", params.start_date);
  if (params.end_date) q.set("end_date", params.end_date);
  const url = `${BASE_URL}/api/availability/summary?${q.toString()}`;
  return fetch(url, { cache: 'no-store' }).then((res) => res.json()) as Promise<AvailabilitySummary>;
}

export async function getClientVisitReport(params: { client_id: string | number; start_date: string; end_date: string }) {
  const q = new URLSearchParams();
  q.set("client_id", String(params.client_id));
  q.set("start_date", params.start_date);
  q.set("end_date", params.end_date);
  const url = `${BASE_URL}/api/reports/client-visits?${q.toString()}`;
  return fetch(url, { cache: 'no-store' }).then((res) => res.json()) as Promise<ClientVisitReport>;
}

// Unavailable employees report
export async function getUnavailableReport(params: { start: string; end?: string }) {
  const q = new URLSearchParams();
  q.set("start", params.start);
  if (params.end) q.set("end", params.end);
  const url = `${BASE_URL}/api/reports/unavailable?${q.toString()}`;
  return fetch(url, { cache: 'no-store' }).then((res) => res.json()) as Promise<UnavailableReportItem[]>;
}

// Returns unique employees who have at least one assignment in the given date window.
export async function getEmployeesOnDuty(params: { start_date: string; end_date: string; department_id?: string | number; position_id?: string | number }) {
  // Fetch assignments-augmented availability
  const avail = await getAvailability({ start_date: params.start_date, end_date: params.end_date, department_id: params.department_id, position_id: params.position_id, show_assignments: 1 });
  // Attempt to extract assignments array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = avail;
  const assignments: unknown[] = Array.isArray(a?.assignments) ? a.assignments : [];

  // Load employees to map ids -> names
  const emps = await getAllEmployees();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const empArr: any[] = Array.isArray(emps) ? emps : [];
  const empMap = new Map<string, { id: string; name: string }>();
  empArr.forEach((e) => empMap.set(String(e.id ?? ""), { id: String(e.id ?? ""), name: e.name }));

  const seen = new Map<string, { id: string; name: string }>();
  type AssignmentLike = { employee_id?: string | number; employee_name?: string };
  assignments.forEach((asgmt) => {
    const item = asgmt as AssignmentLike;
    const id = String(item?.employee_id ?? "");
    const name = item?.employee_name;
    if (!seen.has(id)) {
      seen.set(id, empMap.get(id) ?? { id, name: name ?? "-" });
    }
  });

  return Array.from(seen.values()) as Array<{ id: string; name: string }>;
}

export async function postPrompt(data: PromptRequest) {
  return fetch(`${BASE_URL}/api/llm`, {
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
  return fetch(`${BASE_URL}/api/employees`, { cache: 'no-store' }).then((res) => res.json());
}
// New: fetch all employees with a high limit to avoid server default pagination
export async function getAllEmployees() {
  return fetch(`${BASE_URL}/api/employees?limit=10000`, { cache: 'no-store' }).then((res) => res.json());
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
  return fetch(`${BASE_URL}/api/departments`, { cache: 'no-store' }).then((res) => res.json());
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
  return fetch(`${BASE_URL}/api/positions`, { cache: 'no-store' }).then((res) => res.json());
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
  return fetch(`${BASE_URL}/api/clients`, { cache: 'no-store' }).then((res) => res.json());
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

// Duty Assignments
export async function getDutyAssignments(employee_id: number | string) {
  return fetch(`${BASE_URL}/api/duty_assignments?employee_id=${employee_id}`, { cache: 'no-store' }).then((res) => res.json());
}
export async function postDutyAssignment(data: Omit<DutyAssignment, 'id'>) {
  return fetch(`${BASE_URL}/api/duty_assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}
export async function deleteDutyAssignment(id: number | string) {
  return fetch(`${BASE_URL}/api/duty_assignments?id=${id}`, { method: "DELETE" }).then((res) => res.json());
}
// Optional: migration helpers
export async function migrateDutyAssignments() {
  return fetch(`${BASE_URL}/api/migrate/duty_assignments`, { method: "POST" }).then((res) => res.json());
}
export async function seedDutyAssignments() {
  return fetch(`${BASE_URL}/api/migrate/duty_assignments/seed`, { method: "POST" }).then((res) => res.json());
}
