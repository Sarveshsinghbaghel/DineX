import { useState, type FormEvent } from 'react';
import type { UserPreferences } from '@x10think/types';

export interface PreferencesFormProps {
  preferences?: UserPreferences;
  onSave: (data: UserPreferences) => Promise<void>;
}

export function PreferencesForm({ preferences, onSave }: PreferencesFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(preferences?.theme ?? 'system');
  const [language, setLanguage] = useState(preferences?.language ?? 'en');

  const [mEmail, setMEmail] = useState(preferences?.marketingPreferences?.email ?? true);
  const [mSms, setMSms] = useState(preferences?.marketingPreferences?.sms ?? false);
  const [mPush, setMPush] = useState(preferences?.marketingPreferences?.push ?? true);

  const [oEmail, setOEmail] = useState(preferences?.orderNotifications?.email ?? true);
  const [oSms, setOSms] = useState(preferences?.orderNotifications?.sms ?? true);
  const [oPush, setOPush] = useState(preferences?.orderNotifications?.push ?? true);

  const [rEmail, setREmail] = useState(preferences?.reservationNotifications?.email ?? true);
  const [rSms, setRSms] = useState(preferences?.reservationNotifications?.sms ?? true);
  const [rPush, setRPush] = useState(preferences?.reservationNotifications?.push ?? true);

  const [dietaryInput, setDietaryInput] = useState('');
  const [dietary, setDietary] = useState<string[]>(preferences?.dietaryPreferences ?? []);

  function addDietaryTag() {
    const tag = dietaryInput.trim();
    if (tag && !dietary.includes(tag)) {
      setDietary([...dietary, tag]);
      setDietaryInput('');
    }
  }

  function removeDietaryTag(tag: string) {
    setDietary(dietary.filter((t) => t !== tag));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave({
        theme,
        language,
        marketingPreferences: { email: mEmail, sms: mSms, push: mPush },
        orderNotifications: { email: oEmail, sms: oSms, push: oPush },
        reservationNotifications: { email: rEmail, sms: rSms, push: rPush },
        dietaryPreferences: dietary,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save preferences failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-6 text-xs"
    >
      <div>
        <h2 className="text-lg font-bold text-white">App & Notification Preferences</h2>
        <p className="text-xs text-slate-400">
          Customize theme, language, notifications, and dietary needs.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          Preferences updated successfully!
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          >
            <option value="system">System Default</option>
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Preferred Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          >
            <option value="en">English (en-IN)</option>
            <option value="hi">Hindi (hi-IN)</option>
            <option value="es">Spanish (es)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-700">
        <h3 className="font-bold text-white text-sm">Notification Channels</h3>

        <div className="space-y-2">
          <p className="font-semibold text-slate-300">Order Updates</p>
          <div className="flex items-center space-x-6 text-slate-400">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={oEmail}
                onChange={(e) => setOEmail(e.target.checked)}
              />
              <span>Email</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={oSms} onChange={(e) => setOSms(e.target.checked)} />
              <span>SMS</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={oPush} onChange={(e) => setOPush(e.target.checked)} />
              <span>Push</span>
            </label>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <p className="font-semibold text-slate-300">Reservation Reminders</p>
          <div className="flex items-center space-x-6 text-slate-400">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rEmail}
                onChange={(e) => setREmail(e.target.checked)}
              />
              <span>Email</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={rSms} onChange={(e) => setRSms(e.target.checked)} />
              <span>SMS</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={rPush} onChange={(e) => setRPush(e.target.checked)} />
              <span>Push</span>
            </label>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <p className="font-semibold text-slate-300">Marketing & Offers</p>
          <div className="flex items-center space-x-6 text-slate-400">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={mEmail}
                onChange={(e) => setMEmail(e.target.checked)}
              />
              <span>Email</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={mSms} onChange={(e) => setMSms(e.target.checked)} />
              <span>SMS</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={mPush} onChange={(e) => setMPush(e.target.checked)} />
              <span>Push</span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-700">
        <h3 className="font-bold text-white text-sm">Dietary Preferences</h3>
        <div className="flex space-x-2">
          <input
            value={dietaryInput}
            onChange={(e) => setDietaryInput(e.target.value)}
            placeholder="e.g. Vegetarian, Gluten-Free, Nut Allergy"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={addDietaryTag}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg"
          >
            Add Tag
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {dietary.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-900 border border-slate-700 text-amber-400 font-semibold rounded-full text-xs"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeDietaryTag(tag)}
                className="text-slate-500 hover:text-red-400 font-bold ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-700">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50 text-xs"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
}
