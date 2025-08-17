// src/lib/types.ts


export interface Employee {
  id?: number | string;
  name: string;
  department_id: number;
  position_id: number;
  client_id: number;
}

export interface Department {
  id?: number | string;
  name: string;
}

export interface Position {
  id?: number | string;
  name: string;
}

export interface Client {
  id?: number | string;
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

export interface LLMResponse {
  response: string;
  step?: string;
  missing?: string[];
}

export interface PromptRequest {
  prompt: string;
}

// New: Duty Assignment type
export interface DutyAssignment {
  id?: string | number;
  employee_id: number;
  client_id?: number | null;
  agenda: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // optional; defaults to start_date
  is_unavailable?: 0 | 1; // optional in API response
}

// New: Reports type for client visits
export interface ClientVisitReport {
  total_assignments: number;
  unique_employees: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

// Summary response for availability dashboard
export interface AvailabilitySummary {
  total_assignments: number;
  available: number;
  unavailable: number;
  unassigned: number;
  start_date?: string;
  end_date?: string;
}

// When show_assignments=1 availability returns this shape
export interface AvailabilityWithAssignments {
  total_assignments?: number;
  assignments: DutyAssignment[];
}

// Unavailable report item
export interface UnavailableReportItem {
  employee_id: number | string;
  name: string;
  agenda: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  client: string;     // client name
}
