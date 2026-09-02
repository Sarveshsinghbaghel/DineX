import { useState, type ChangeEvent } from 'react';
import type { AvatarMeta } from '@x10think/types';

export interface AvatarUploaderProps {
  avatar?: AvatarMeta;
  onUpload: (base64Data: string, mimeType: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function AvatarUploader({ avatar, onUpload, onDelete }: AvatarUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 5 MB.');
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await onUpload(base64, file.type);
        setLoading(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file.');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete your profile avatar?')) return;
    setLoading(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white">Profile Avatar</h2>
      <p className="text-xs text-slate-400">
        Upload a JPG, PNG, WebP, or GIF image (max 5 MB). Managed securely via Cloudinary.
      </p>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-900 border-2 border-amber-500/40 flex items-center justify-center text-slate-500 text-3xl font-bold">
          {avatar?.url ? (
            <img src={avatar.url} alt="Profile Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
          {loading && (
            <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-amber-500"></div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="inline-block cursor-pointer py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-xs transition-colors">
            {avatar?.url ? 'Change Avatar' : 'Upload Avatar'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => void handleFileChange(e)}
              disabled={loading}
              className="hidden"
            />
          </label>

          {avatar?.url && (
            <button
              onClick={() => void handleDelete()}
              disabled={loading}
              className="block text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove Avatar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
