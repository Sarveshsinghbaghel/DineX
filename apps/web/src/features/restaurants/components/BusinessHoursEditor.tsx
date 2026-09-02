import { useState } from 'react';
import type { WeeklyBusinessHours, DayBusinessHours } from '@x10think/types';

export interface BusinessHoursEditorProps {
  initialHours?: WeeklyBusinessHours;
  onSave: (hours: WeeklyBusinessHours) => Promise<void>;
}

const DEFAULT_DAYS: Array<DayBusinessHours['day']> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function BusinessHoursEditor({ initialHours, onSave }: BusinessHoursEditorProps) {
  const [hours, setHours] = useState<WeeklyBusinessHours>(() => {
    if (initialHours && initialHours.length > 0) return initialHours;
    return DEFAULT_DAYS.map((day) => ({
      day,
      isClosed: false,
      intervals: [{ open: '09:00', close: '22:00' }],
    }));
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggleClosed(dayIndex: number) {
    setHours((prev) =>
      prev.map((dh, i) => (i === dayIndex ? { ...dh, isClosed: !dh.isClosed } : dh)),
    );
  }

  function handleIntervalChange(
    dayIndex: number,
    intervalIndex: number,
    field: 'open' | 'close',
    value: string,
  ) {
    setHours((prev) =>
      prev.map((dh, i) => {
        if (i !== dayIndex) return dh;
        const newIntervals = dh.intervals.map((inv, j) =>
          j === intervalIndex ? { ...inv, [field]: value } : inv,
        );
        return { ...dh, intervals: newIntervals };
      }),
    );
  }

  function addInterval(dayIndex: number) {
    setHours((prev) =>
      prev.map((dh, i) =>
        i === dayIndex
          ? { ...dh, intervals: [...dh.intervals, { open: '18:00', close: '23:00' }] }
          : dh,
      ),
    );
  }

  function removeInterval(dayIndex: number, intervalIndex: number) {
    setHours((prev) =>
      prev.map((dh, i) =>
        i === dayIndex
          ? { ...dh, intervals: dh.intervals.filter((_, j) => j !== intervalIndex) }
          : dh,
      ),
    );
  }

  async function handleSubmit() {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await onSave(hours);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save business hours failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-6 text-xs">
      <div>
        <h2 className="text-lg font-bold text-white">Weekly Business Hours</h2>
        <p className="text-slate-400">
          Configure operating opening & closing intervals. Overnight hours (e.g. 18:00 to 02:00) are
          fully supported.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          Business hours updated successfully!
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {hours.map((dayObj, dayIdx) => (
          <div
            key={dayObj.day}
            className={`p-4 rounded-xl border transition-all ${
              dayObj.isClosed
                ? 'bg-slate-900/40 border-slate-800 opacity-60'
                : 'bg-slate-900/80 border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white uppercase text-xs tracking-wider">
                {dayObj.day}
              </span>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dayObj.isClosed}
                  onChange={() => handleToggleClosed(dayIdx)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500"
                />
                <span className="text-slate-300 font-semibold">Mark Closed</span>
              </label>
            </div>

            {!dayObj.isClosed && (
              <div className="space-y-2">
                {dayObj.intervals.map((inv, invIdx) => (
                  <div key={invIdx} className="flex items-center space-x-3">
                    <div>
                      <span className="text-slate-400 mr-2">Open</span>
                      <input
                        type="time"
                        value={inv.open}
                        onChange={(e) =>
                          handleIntervalChange(dayIdx, invIdx, 'open', e.target.value)
                        }
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 mr-2">Close</span>
                      <input
                        type="time"
                        value={inv.close}
                        onChange={(e) =>
                          handleIntervalChange(dayIdx, invIdx, 'close', e.target.value)
                        }
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    {dayObj.intervals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInterval(dayIdx, invIdx)}
                        className="text-red-400 hover:text-red-300 font-bold text-sm px-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addInterval(dayIdx)}
                  className="text-amber-500 hover:text-amber-400 text-[11px] font-semibold pt-1 block"
                >
                  + Add Interval
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Weekly Business Hours'}
        </button>
      </div>
    </div>
  );
}
