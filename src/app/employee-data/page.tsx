"use client";

import React, { useEffect, useState } from "react";
import { getEmployees, getDepartments, getPositions, getClients } from "@/lib/api";

interface Employee {
  id: number;
  name: string;
  department_id?: number;
  position_id?: number;
  client_id?: number;
  [key: string]: any;
}


export default function EmployeeDataPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<{ id?: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id?: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id?: string; name: string }[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getEmployees(),
      getDepartments(),
      getPositions(),
      getClients(),
    ]).then(([emp, dept, pos, cli]) => {
      setEmployees(Array.isArray(emp) ? emp : []);
      setDepartments(Array.isArray(dept) ? dept : []);
      setPositions(Array.isArray(pos) ? pos : []);
      setClients(Array.isArray(cli) ? cli : []);
      setLoading(false);
    });
  }, []);

  const getName = (id: number | string | undefined, arr: { id?: string; name: string }[]) => {
    if (!id) return "-";
    const found = arr.find((item) => String(item.id) === String(id));
    return found ? found.name : "-";
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchName = emp.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchDept = !departmentFilter || String(emp.department_id) === departmentFilter;
    const matchPos = !positionFilter || String(emp.position_id) === positionFilter;
    const matchCli = !clientFilter || String(emp.client_id) === clientFilter;
    return matchName && matchDept && matchPos && matchCli;
  });

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Data Karyawan</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1">Nama</label>
          <input
            className="border px-3 py-2 rounded"
            placeholder="Cari nama karyawan..."
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1">Departemen</label>
          <select
            className="border px-3 py-2 rounded"
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1">Posisi</label>
          <select
            className="border px-3 py-2 rounded"
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
          >
            <option value="">Semua Posisi</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1">Client</label>
          <select
            className="border px-3 py-2 rounded"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="">Semua Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead>
              <tr>
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Nama</th>
                <th className="px-4 py-2 border">Department</th>
                <th className="px-4 py-2 border">Position</th>
                <th className="px-4 py-2 border">Client</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td className="px-4 py-2 border">{emp.id}</td>
                  <td className="px-4 py-2 border">{emp.name}</td>
                  <td className="px-4 py-2 border">{getName(emp.department_id, departments)}</td>
                  <td className="px-4 py-2 border">{getName(emp.position_id, positions)}</td>
                  <td className="px-4 py-2 border">{getName(emp.client_id, clients)}</td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400">Tidak ada data karyawan ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
