import { useState } from 'react';
import { User, Lock, Bell, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

function Section({ title, children }) {
  return (
    <div className="card mb-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const [notifications, setNotifications] = useState({
    renewalReminders: true,
    bookingConfirmations: true,
    paymentReceipts: true,
  });

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error('Name cannot be empty.'); return; }
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { name: profile.name.trim(), phone: profile.phone.trim() });
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!passwords.current)  { toast.error('Current password is required.'); return; }
    if (passwords.newPass.length < 8) { toast.error('New password must be at least 8 characters.'); return; }
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match.'); return; }
    setSavingPwd(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword:     passwords.newPass,
      });
      toast.success('Password changed successfully.');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password change failed.');
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="font-display text-2xl font-medium text-gray-900 mb-1 flex items-center gap-2">
        <User className="w-5 h-5" /> Profile & Settings
      </h1>
      <p className="text-sm text-gray-500 mb-6">Manage your account details and preferences.</p>

      {/* Account info badge */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center text-lg font-bold text-white shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <span className={`mt-1 ${user?.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>
            {user?.role}
          </span>
        </div>
        <Shield className="w-4 h-4 text-gray-300 ml-auto" />
      </div>

      {/* Profile form */}
      <Section title="Personal information">
        <form onSubmit={handleSaveProfile}>
          <Field label="Full name">
            <input className="input" value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Email address" hint="Email cannot be changed. Contact admin if needed.">
            <input className="input bg-gray-50 cursor-not-allowed" value={user?.email} disabled />
          </Field>
          <Field label="Phone number" hint="Used for booking confirmations.">
            <input className="input" type="tel" placeholder="9876543210" value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
          </Field>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </Section>

      {/* Password change */}
      <Section title="Change password">
        <form onSubmit={handleChangePassword}>
          <Field label="Current password">
            <input className="input" type="password" placeholder="••••••••"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} />
          </Field>
          <Field label="New password" hint="Minimum 8 characters.">
            <input className="input" type="password" placeholder="••••••••"
              value={passwords.newPass}
              onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))} />
          </Field>
          <Field label="Confirm new password">
            <div className="relative">
              <input className="input pr-9" type="password" placeholder="••••••••"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} />
              {passwords.confirm && passwords.newPass === passwords.confirm && (
                <CheckCircle className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </Field>
          <button type="submit" disabled={savingPwd} className="btn-primary flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            {savingPwd ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </Section>

      {/* Notification preferences */}
      <Section title="Notification preferences">
        <div className="space-y-3">
          {[
            { key: 'renewalReminders',    label: 'Renewal reminders',     desc: 'Get an email 3 days before your membership expires.' },
            { key: 'bookingConfirmations', label: 'Booking confirmations', desc: 'Receive a confirmation email when you book a seat.' },
            { key: 'paymentReceipts',     label: 'Payment receipts',      desc: 'Get a receipt after every successful payment.' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input type="checkbox" className="sr-only"
                  checked={notifications[key]}
                  onChange={(e) => setNotifications((n) => ({ ...n, [key]: e.target.checked }))} />
                <div className={`w-9 h-5 rounded-full transition-colors ${notifications[key] ? 'bg-gray-900' : 'bg-gray-200'}`} />
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={() => toast.success('Notification preferences saved.')}
          className="btn-secondary mt-4 flex items-center gap-2"
        >
          <Bell className="w-3.5 h-3.5" /> Save preferences
        </button>
      </Section>
    </div>
  );
}
