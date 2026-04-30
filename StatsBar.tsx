import { useState } from 'react';
import { AuthUser, updateProfile, changePassword, signOut, deleteAccount } from '../utils/auth';
import {
  X,
  User,
  Lock,
  Trash2,
  LogOut,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';

const AVATARS = ['🧑‍🎓', '👨‍💻', '👩‍💻', '🧑‍🔬', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🔬', '🦊', '🐱', '🐻', '🦁', '🐸', '🐼', '🦉', '🦅', '🦄', '🐲', '🐵', '🐯'];

interface ProfileSettingsProps {
  user: AuthUser;
  onUpdate: (user: AuthUser) => void;
  onSignOut: () => void;
  onClose: () => void;
}

export default function ProfileSettings({ user, onUpdate, onSignOut, onClose }: ProfileSettingsProps) {
  const [tab, setTab] = useState<'profile' | 'password' | 'danger'>('profile');
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatar, setAvatar] = useState(user.avatar);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSaveProfile = () => {
    setError('');
    setSuccess('');
    const updated = updateProfile({ displayName: displayName.trim(), avatar });
    if (updated) {
      onUpdate(updated);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to change password.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setLoading(true);
    setError('');

    const result = await deleteAccount(deletePassword);
    setLoading(false);

    if (result.success) {
      onSignOut();
    } else {
      setError(result.error || 'Failed to delete account.');
    }
  };

  const handleSignOut = () => {
    signOut();
    onSignOut();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2.5 rounded-xl">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {[
            { key: 'profile' as const, label: 'Profile', icon: User },
            { key: 'password' as const, label: 'Password', icon: Lock },
            { key: 'danger' as const, label: 'Account', icon: Trash2 },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(''); setSuccess(''); }}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative ${
                tab === t.key ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {tab === t.key && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 mb-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="space-y-5">
              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar</label>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{avatar}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{displayName || user.username}</p>
                    <p className="text-xs text-gray-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-10 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`text-xl p-1.5 rounded-lg transition-all ${
                        avatar === a
                          ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}

          {/* Password Tab */}
          {tab === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
                  autoComplete="new-password"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Change Password
              </button>
            </div>
          )}

          {/* Danger Tab */}
          {tab === 'danger' && (
            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Danger Zone
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password to confirm"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm text-gray-900"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || !deletePassword}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
