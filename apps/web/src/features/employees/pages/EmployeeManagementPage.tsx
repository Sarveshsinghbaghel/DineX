import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { Employee, Shift, Attendance } from '@x10think/types';

export function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'shifts' | 'attendance'>('employees');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchEmployeeData();
  }, []);

  async function fetchEmployeeData() {
    setLoading(true);
    setError(null);
    try {
      const [empRes, shiftRes, attRes] = await Promise.all([
        httpClient.get<{ data: Employee[] }>('/employees'),
        httpClient.get<{ data: Shift[] }>('/employees/shifts/list'),
        httpClient.get<{ data: Attendance[] }>('/employees/attendance/list'),
      ]);

      setEmployees(Array.isArray(empRes.data.data) ? empRes.data.data : []);
      setShifts(Array.isArray(shiftRes.data.data) ? shiftRes.data.data : []);
      setAttendanceRecords(Array.isArray(attRes.data.data) ? attRes.data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee records');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Management</h1>
          <p className="text-xs text-slate-400">
            Staff directory, employment status transitions, shift scheduling, and attendance
            tracking.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'employees'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Staff Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'shifts'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Shift Schedule ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'attendance'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Attendance Ledger ({attendanceRecords.length})
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading employee records...</div>
        ) : activeTab === 'employees' ? (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Employee No.</th>
                <th className="p-3">Linked User</th>
                <th className="p-3">Job Title & Dept</th>
                <th className="p-3">Employment Type</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {employees.map((emp) => {
                const uName = typeof emp.userId === 'object' ? emp.userId.name : emp.userId;
                return (
                  <tr key={emp._id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-mono font-bold text-amber-400">{emp.employeeNumber}</td>
                    <td className="p-3 font-semibold text-white">{uName}</td>
                    <td className="p-3">
                      <div>{emp.jobTitle || 'Staff Member'}</div>
                      <div className="text-[10px] text-slate-400">
                        {emp.department || 'Operations'}
                      </div>
                    </td>
                    <td className="p-3 uppercase text-[10px]">
                      {emp.employmentType?.replace('_', ' ')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                          emp.employmentStatus === 'active'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {emp.employmentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : activeTab === 'shifts' ? (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Shift Hours</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {shifts.map((sh) => {
                const empName =
                  typeof sh.employeeId === 'object'
                    ? (sh.employeeId as any).employeeNumber
                    : sh.employeeId;
                return (
                  <tr key={sh._id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-mono text-white">{sh.date}</td>
                    <td className="p-3 font-semibold">{empName}</td>
                    <td className="p-3 font-mono text-amber-400">
                      {sh.startTime} - {sh.endTime}
                    </td>
                    <td className="p-3 uppercase text-[10px] font-bold">{sh.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Work Date</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attendanceRecords.map((att) => (
                <tr key={att._id} className="hover:bg-slate-700/30">
                  <td className="p-3 font-mono text-white">{att.workDate}</td>
                  <td className="p-3 font-semibold">
                    Staff #{att.employeeId?.toString().slice(-4)}
                  </td>
                  <td className="p-3 font-mono">
                    {att.clockInAt ? new Date(att.clockInAt).toLocaleTimeString() : 'N/A'}
                  </td>
                  <td className="p-3 font-mono">
                    {att.clockOutAt ? new Date(att.clockOutAt).toLocaleTimeString() : 'N/A'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                        att.status === 'present'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : att.status === 'late'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
