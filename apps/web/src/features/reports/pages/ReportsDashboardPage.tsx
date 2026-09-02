import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { ReportPreviewResult, ReportType, ReportExportFormat } from '@x10think/types';

export function ReportsDashboardPage() {
  const [reportType, setReportType] = useState<ReportType>('taxes');
  const [period, setPeriod] = useState<string>('last_30_days');
  const [previewData, setPreviewData] = useState<ReportPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchReportPreview();
  }, [reportType, period]);

  async function fetchReportPreview() {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<{ data: ReportPreviewResult }>(
        `/reports/preview?reportType=${reportType}&period=${period}`,
      );
      setPreviewData(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report preview');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: ReportExportFormat) {
    setExporting(format);
    setError(null);
    try {
      const response = await httpClient.get(
        `/reports/export?reportType=${reportType}&period=${period}&format=${format}`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], {
        type:
          format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : format === 'pdf'
              ? 'application/pdf'
              : 'text/csv',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DineX_${reportType}_Report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Data Export Center</h1>
          <p className="text-xs text-slate-400">
            Generate and export tax compliance, sales, inventory, and employee attendance reports in
            CSV, XLSX, and PDF.
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => void handleExport('csv')}
            disabled={!previewData || exporting !== null}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>📄 CSV</span>
          </button>
          <button
            onClick={() => void handleExport('xlsx')}
            disabled={!previewData || exporting !== null}
            className="px-3.5 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>📊 XLSX</span>
          </button>
          <button
            onClick={() => void handleExport('pdf')}
            disabled={!previewData || exporting !== null}
            className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>📕 PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Report Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-bold">Select Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-amber-500 font-semibold"
          >
            <option value="taxes">Tax / GST Compliance Report</option>
            <option value="sales">Sales Overview Report</option>
            <option value="revenue">Revenue Summary Report</option>
            <option value="orders">Orders Execution Report</option>
            <option value="inventory">Inventory & Stock Report</option>
            <option value="menu">Menu Item Performance Report</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-bold">Select Date Range</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-amber-500 font-semibold"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="previous_month">Previous Month</option>
          </select>
        </div>
      </div>

      {/* Dataset Preview */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-xs space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Generating report preview...</div>
        ) : previewData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white">{previewData.title}</h3>
                <span className="text-[10px] text-slate-400">
                  Range: {previewData.dateRange.startDate} to {previewData.dateRange.endDate} |
                  Timezone: {previewData.timezone}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded font-bold text-[10px]">
                {previewData.totalRows} Records
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-700 rounded-lg">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                  <tr>
                    {previewData.columns.map((col) => (
                      <th key={col.key} className="p-3">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30">
                      {previewData.columns.map((col) => {
                        const val = row[col.key];
                        return (
                          <td key={col.key} className="p-3">
                            {col.type === 'currency' && typeof val === 'number'
                              ? `₹${val.toFixed(2)}`
                              : String(val ?? '')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">No report preview available.</div>
        )}
      </div>
    </div>
  );
}
