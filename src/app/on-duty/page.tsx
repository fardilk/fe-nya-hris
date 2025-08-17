"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllEmployees, getClients, getClientVisitReport, getAvailabilitySummary, getUnavailableReport } from "@/lib/api";
import type { ClientVisitReport, UnavailableReportItem } from "@/lib/types";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Emp { id?: number | string; name: string }
interface Cli { id?: number | string; name: string }

interface Row {
  id: string | number | undefined;
  employeeId: string;
  employeeName: string;
  agenda: string;
  start_date: string; // YYYY-MM-DD or '-'
  end_date: string;   // YYYY-MM-DD or '-'
  clientName: string;
  is_unavailable?: 0 | 1;
  days: number; // business days excluding Sat/Sun
  isPlaceholder?: boolean; // true when employee has no assignments
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

function businessDaysInclusive(start: string, end: string): number {
  const s = parseYMD(start);
  const e = parseYMD(end);
  if (e.getTime() < s.getTime()) return 0;
  let count = 0;
  const cur = new Date(s.getTime());
  while (cur.getTime() <= e.getTime()) {
    const day = cur.getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function todayYMD() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function OnDutyPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  // counts come from summary endpoint
  const [totalAssignmentsNum, setTotalAssignmentsNum] = useState(0);
  const [availableNum, setAvailableNum] = useState(0);
  const [unavailableNum, setUnavailableNum] = useState(0);
  const [unassignedNum, setUnassignedNum] = useState(0);
  const [date, setDate] = useState<string>(() => todayYMD());
  const [clientList, setClientList] = useState<Cli[]>([]);
  const [clientReports, setClientReports] = useState<Array<{ clientId: string; clientName: string; total: number; unique: number }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientReport, setSelectedClientReport] = useState<ClientVisitReport | null>(null);
  // employeesOnDuty no longer needed when using summary counts exclusively

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch availability summary (for dashboard cards), employees, clients,
      // and assignment-augmented availability (for table rows)
  const [summary, empList, cliList] = await Promise.all([
        getAvailabilitySummary({ start_date: date, end_date: date }),
        getAllEmployees(),
        getClients(),
      ]);
  const emps: Emp[] = Array.isArray(empList) ? empList : [];
      // summary may have counts we need
      if (summary && typeof summary === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s: any = summary;
        setTotalAssignmentsNum(typeof s.total_assignments === 'number' ? s.total_assignments : 0);
        setAvailableNum(typeof s.available === 'number' ? s.available : 0);
        setUnavailableNum(typeof s.unavailable === 'number' ? s.unavailable : 0);
        setUnassignedNum(typeof s.unassigned === 'number' ? s.unassigned : 0);
  // no detailed available list needed here
      }

      const clientsArr: Cli[] = Array.isArray(cliList) ? cliList : [];
      setClientList(clientsArr);
      const clientMap = new Map<string, string>();
      clientsArr.forEach((c) => clientMap.set(String(c.id ?? ""), c.name));

      // Determine assignments from unavailable report for the specific date
      let unavailableItems: UnavailableReportItem[] = [];
      try {
        unavailableItems = await getUnavailableReport({ start: date, end: date });
      } catch {
        unavailableItems = [];
      }

      // Build KPI per client using reports endpoint for the selected period
  const reports = await Promise.all(
        clientsArr.map(async (c) => {
          try {
            const r = await getClientVisitReport({ client_id: String(c.id ?? ""), start_date: date, end_date: date });
            return { clientId: String(c.id ?? ""), clientName: c.name, total: r.total_assignments, unique: r.unique_employees };
          } catch {
            return { clientId: String(c.id ?? ""), clientName: c.name, total: 0, unique: 0 };
          }
        })
      );
      setClientReports(reports);
      if (selectedClientId) {
  const found = reports.find(r => r.clientId === selectedClientId);
  setSelectedClientReport(found ? { total_assignments: found.total, unique_employees: found.unique, start_date: date, end_date: date } : null);
      } else {
        setSelectedClientReport(null);
      }

  // Build rows directly from unavailableItems (employees assigned/unavailable on this date)
      const allRows: Row[] = [];
      const empNameMap = new Map<string, string>();
      emps.forEach((e) => empNameMap.set(String(e.id ?? ""), e.name));
      if (Array.isArray(unavailableItems)) {
        unavailableItems.forEach((u, idx) => {
          const empId = String(u.employee_id ?? "");
          const start = (u.start_date || "").slice(0, 10);
          const end = ((u.end_date && u.end_date.length > 0) ? u.end_date : u.start_date || "").slice(0, 10);
          allRows.push({
            id: `${empId}-${idx}`,
            employeeId: empId,
            employeeName: u.name || empNameMap.get(empId) || "-",
            agenda: u.agenda,
            start_date: start,
            end_date: end,
            clientName: u.client || "-",
            is_unavailable: 1,
            days: start && end ? businessDaysInclusive(start, end) : 0,
            isPlaceholder: false,
          });
        });
      }

      // Sort assignments
      allRows.sort((a, b) => {
        if (a.start_date === b.start_date) return 0;
        return a.start_date > b.start_date ? -1 : 1;
      });
      setRows(allRows);

  // We rely on summary counts for unavailable/available; no extra fetch
    } finally {
      setLoading(false);
    }
  }, [date, selectedClientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Statistics and charts
  const { clientLabels, clientCounts, availableCount, unavailableCount, unassignedCount } = useMemo(() => {
    const labels = clientReports.map(r => r.clientName);
    const counts = clientReports.map(r => r.total);
    return {
      clientLabels: labels,
      clientCounts: counts,
      availableCount: availableNum,
      unavailableCount: unavailableNum,
      unassignedCount: unassignedNum,
    };
  }, [clientReports, availableNum, unavailableNum, unassignedNum]);

  return (
    <div className="max-w-5xl mx-auto py-10">
      {/* Navigation */}
      <nav className="mb-4 flex items-center gap-3 flex-wrap">
        <Link href="/" className="text-blue-600 hover:underline font-semibold">Home</Link>
        <button onClick={fetchAll} className="text-sm px-3 py-1 rounded border hover:bg-gray-50" disabled={loading}>Refresh</button>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">All Clients</option>
            {clientList.map((c) => (
              <option key={String(c.id ?? "")} value={String(c.id ?? "")}>{c.name}</option>
            ))}
          </select>
          <button onClick={fetchAll} className="text-sm px-3 py-1 rounded border hover:bg-gray-50" disabled={loading}>Apply</button>
        </div>
      </nav>

      <h1 className="text-2xl font-bold mb-2">Semua Karyawan On Duty</h1>
  <p className="text-gray-600 mb-4">Tanggal ditampilkan sebagai YYYY-MM-DD.</p>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Total Assignments</div>
          <div className="text-2xl font-bold">{totalAssignmentsNum}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Available</div>
          <div className="text-2xl font-bold text-green-600">{availableCount}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Unavailable</div>
          <div className="text-2xl font-bold text-red-600">{unavailableCount}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Unassigned</div>
          <div className="text-2xl font-bold text-slate-500">{unassignedCount}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">KPI{selectedClientId ? `: ${clientList.find(c=>String(c.id??"")===selectedClientId)?.name ?? ""}` : " (select client)"}</div>
          <div className="text-sm text-gray-700">{date}</div>
          {selectedClientId && selectedClientReport ? (
            <div className="mt-1 text-sm">
              <div>Total: <span className="font-semibold">{selectedClientReport!.total_assignments}</span></div>
              <div>Unique Employees: <span className="font-semibold">{selectedClientReport!.unique_employees}</span></div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-500">Pilih client untuk KPI</div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-1">Penugasan per Client</h3>
          <p className="text-xs text-gray-500 mb-2">Periode: {date}</p>
          <Bar data={{ labels: clientLabels, datasets: [{ label: "Penugasan per Client", data: clientCounts, backgroundColor: "#3b82f6" }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-1">Distribusi Ketersediaan</h3>
          <p className="text-xs text-gray-500 mb-2">Periode: {date}</p>
          <Pie data={{ labels: ["Available", "Unavailable"], datasets: [{ data: [availableCount, unavailableCount], backgroundColor: ["#22c55e", "#ef4444"] }] }} options={{ responsive: true }} />
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Karyawan</th>
              <th className="px-4 py-2 border">Agenda</th>
              <th className="px-4 py-2 border">Start Date</th>
              <th className="px-4 py-2 border">End Date</th>
              <th className="px-4 py-2 border">Total (Hari Kerja)</th>
              <th className="px-4 py-2 border">Client</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">Loading...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">Tidak ada data penugasan.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={String(r.id) + ":" + r.employeeId}>
                  <td className="px-4 py-2 border whitespace-nowrap">{r.employeeName}</td>
                  <td className={"px-4 py-2 border whitespace-pre-wrap " + (r.isPlaceholder ? "text-green-600 font-semibold" : "")}>{r.agenda}</td>
                  <td className="px-4 py-2 border">{r.start_date}</td>
                  <td className="px-4 py-2 border">{r.end_date}</td>
                  <td className="px-4 py-2 border">{r.isPlaceholder ? 0 : (r.start_date === r.end_date ? 1 : r.days)} hari</td>
                  <td className="px-4 py-2 border">{r.clientName}</td>
                </tr>
              ))
            )}
          </tbody>
          {/* Footer showing total unavailable (assigned) employees for the selected date */}
          <tfoot>
            <tr className="bg-gray-50">
              <td className="px-4 py-2 border text-gray-700 font-semibold" colSpan={4}>
                Total Karyawan Tidak Tersedia (Ditugaskan) — {date}
              </td>
              <td className="px-4 py-2 border font-bold text-red-600">
                {unavailableNum}
              </td>
              <td className="px-4 py-2 border" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
