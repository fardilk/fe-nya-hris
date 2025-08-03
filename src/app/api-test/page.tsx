"use client";
import React, { useState } from "react";
import { getEmployees, postEmployee, getDepartments, getPositions, getClients, postLLM } from "@/lib/api";
import { Employee, Department, Position, Client } from "@/lib/types";

export default function ApiTestPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [llmResponse, setLlmResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState("");
  const [newEmployee, setNewEmployee] = useState<{ name: string; department_id: number | ""; position_id: number | ""; client_id: number | "" }>({ name: "", department_id: "", position_id: "", client_id: "" });
  const [postEmployeeResult, setPostEmployeeResult] = useState<unknown>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Fetch departments and positions on mount
  React.useEffect(() => {
    getDepartments().then(setDepartments);
    getPositions().then(setPositions);
    getClients().then(setClients);
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      <div className="space-x-2 mb-4">
        <form
          className="mb-4 space-y-2 bg-gray-50 p-4 rounded"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading("postEmployee");
            try {
              const result = await postEmployee({
                ...newEmployee,
                department_id: typeof newEmployee.department_id === "string" ? Number(newEmployee.department_id) : newEmployee.department_id,
                position_id: typeof newEmployee.position_id === "string" ? Number(newEmployee.position_id) : newEmployee.position_id,
                client_id: typeof newEmployee.client_id === "string" ? Number(newEmployee.client_id) : newEmployee.client_id,
              });
              setPostEmployeeResult(result);
              setSuccessMessage("Sukses membuat karyawan!");
              setTimeout(() => setSuccessMessage(""), 3000);
            } catch (err) {
              setPostEmployeeResult(err);
              setSuccessMessage("");
            }
            setLoading("");
          }}
        >
          <div className="font-semibold">Create Employee</div>
          <input
            className="border px-2 py-1 rounded mr-2"
            placeholder="Name"
            value={newEmployee.name}
            onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
            required
          />
          <select
            className="border px-2 py-1 rounded mr-2"
            value={newEmployee.department_id}
            onChange={e => setNewEmployee({ ...newEmployee, department_id: e.target.value === "" ? "" : Number(e.target.value) })}
            required
          >
            <option value="">Pilih Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            className="border px-2 py-1 rounded mr-2"
            value={newEmployee.position_id}
            onChange={e => setNewEmployee({ ...newEmployee, position_id: e.target.value === "" ? "" : Number(e.target.value) })}
            required
          >
            <option value="">Pilih Posisi</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="border px-2 py-1 rounded mr-2"
            value={newEmployee.client_id}
            onChange={e => setNewEmployee({ ...newEmployee, client_id: e.target.value === "" ? "" : Number(e.target.value) })}
            required
          >
            <option value="">Pilih Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1 bg-orange-500 text-white rounded"
            disabled={loading === "postEmployee"}
          >
            Create Employee
          </button>
        </form>
        {successMessage && (
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded mb-2 font-semibold">
            {successMessage}
          </div>
        )}
        {typeof postEmployeeResult === "object" && postEmployeeResult !== null && (
          <div>
            <h2 className="font-semibold">Create Employee Result</h2>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(postEmployeeResult, null, 2)}
            </pre>
          </div>
        )}
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={async () => {
            setLoading("employees");
            setEmployees(await getEmployees());
            setLoading("");
          }}
          disabled={loading === "employees"}
        >
          Get Employees
        </button>
        <button
          className="px-3 py-1 bg-green-500 text-white rounded"
          onClick={async () => {
            setLoading("departments");
            setDepartments(await getDepartments());
            setLoading("");
          }}
          disabled={loading === "departments"}
        >
          Get Departments
        </button>
        <button
          className="px-3 py-1 bg-purple-500 text-white rounded"
          onClick={async () => {
            setLoading("llm");
            try {
              setLlmResponse(await postLLM({ prompt: "Apa itu HR?" }));
            } catch (err) {
              setLlmResponse({ error: err instanceof Error ? err.message : String(err) });
            }
            setLoading("");
          }}
          disabled={loading === "llm"}
        >
          Test LLM
        </button>
      </div>
      <div>
        <h2 className="font-semibold">Employees</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(employees, null, 2)}</pre>
      </div>
      <div>
        <h2 className="font-semibold">Departments</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(departments, null, 2)}</pre>
      </div>
      <div>
        <h2 className="font-semibold">LLM Response</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(llmResponse as object, null, 2)}</pre>
      </div>
    </div>
  );
}
