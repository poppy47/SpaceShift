import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register }      = useAuth();
  const navigate          = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created!');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <BookOpen className="w-6 h-6 text-gray-800" />
          <span className="font-display text-xl font-medium text-gray-900">Study Library</span>
        </div>

        <div className="card">
          <h1 className="text-lg font-medium text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Join and book your study seat.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { k: 'name',     label: 'Full name', type: 'text',     placeholder: 'Riya Sharma' },
              { k: 'email',    label: 'Email',     type: 'email',    placeholder: 'you@example.com' },
              { k: 'phone',    label: 'Phone',     type: 'tel',      placeholder: '9876543210' },
              { k: 'password', label: 'Password',  type: 'password', placeholder: '••••••••' },
            ].map(({ k, label, type, placeholder }) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
                <input className="input" type={type} placeholder={placeholder} required={k !== 'phone'}
                  value={form[k]} onChange={set(k)} />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-5">
            Already have an account? <Link to="/login" className="text-gray-900 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
