import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { httpClient } from '@/shared/lib/http';
import type { TableRecord } from '@x10think/types';

export function TableQRManagementPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [section, setSection] = useState('Main Dining');
  const [selectedQR, setSelectedQR] = useState<TableRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (branchId) void fetchTables();
  }, [branchId]);

  async function fetchTables() {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<{ data: TableRecord[] }>(
        `/qr/tables/branch/${branchId}`,
      );
      setTables(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branch tables.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTable() {
    if (!tableNumber.trim() || !branchId) return;
    setError(null);
    try {
      await httpClient.post('/qr/tables', {
        branchId,
        tableNumber: tableNumber.trim(),
        capacity: Number(capacity),
        section: section.trim(),
      });
      setTableNumber('');
      void fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table.');
    }
  }

  async function handleRegenerateQR(tableId: string) {
    setError(null);
    try {
      await httpClient.post(`/qr/tables/${tableId}/generate`);
      void fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate QR token.');
    }
  }

  async function handleToggleQRStatus(tableId: string, currentStatus: string) {
    setError(null);
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await httpClient.patch(`/qr/tables/${tableId}/status`, { status: newStatus });
      void fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update QR status.');
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>Table QR Management</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              Phase 20
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Create restaurant tables, generate non-guessable QR tokens, and print/download table QR
            standees.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Add New Table Form */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-xs space-y-3">
        <h3 className="font-bold text-white">Add New Table</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-400 mb-1">Table Number</label>
            <input
              type="text"
              placeholder="e.g. T-01"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Section</label>
            <input
              type="text"
              placeholder="e.g. Main Hall"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => void handleCreateTable()}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors"
            >
              + Create Table & QR
            </button>
          </div>
        </div>
      </div>

      {/* Tables Directory */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-xs space-y-4">
        <h3 className="font-bold text-white text-sm">Registered Branch Tables</h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Fetching table QR records...</div>
        ) : tables.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No tables created yet.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-700 rounded-lg">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="p-3">Table No</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">QR Token</th>
                  <th className="p-3">QR Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tables.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-bold text-white">{t.tableNumber}</td>
                    <td className="p-3">{t.section}</td>
                    <td className="p-3 font-mono">{t.capacity} seats</td>
                    <td className="p-3 font-mono text-[10px] text-amber-400">{t.qrToken}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          t.qrStatus === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {t.qrStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedQR(t)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded"
                      >
                        🖨️ Print Standee
                      </button>
                      <button
                        onClick={() => void handleRegenerateQR(t._id)}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded"
                      >
                        🔄 Regenerate
                      </button>
                      <button
                        onClick={() => void handleToggleQRStatus(t._id, t.qrStatus)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded"
                      >
                        {t.qrStatus === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print QR Standee Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">Table QR Card Standee</h3>
              <button onClick={() => setSelectedQR(null)} className="text-slate-400 text-sm">
                ✕
              </button>
            </div>

            <div className="p-6 bg-white rounded-xl text-slate-900 space-y-3">
              <span className="text-[10px] uppercase font-black text-amber-600 tracking-widest block">
                DineX Scan & Order
              </span>
              <h2 className="text-2xl font-black">{selectedQR.tableNumber}</h2>
              <span className="text-xs text-slate-600 block">{selectedQR.section}</span>

              <div className="p-4 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg text-xs font-mono break-all font-bold">
                https://dinex.app/qr/{selectedQR.qrToken}
              </div>

              <p className="text-[10px] text-slate-500">
                Scan with phone camera to view menu & place live order
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
            >
              Print / Save PDF Standee
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
