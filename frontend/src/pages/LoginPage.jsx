import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }         = useAuth();
  const navigate          = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background circle */}
            <rect width="48" height="48" fill="none"/>
            {/* Left book page */}
            <rect x="8" y="10" width="14" height="20" fill="none" stroke="#000000" strokeWidth="1.5" rx="1"/>
            {/* Right book page */}
            <rect x="22" y="10" width="14" height="20" fill="none" stroke="#000000" strokeWidth="1.5" rx="1"/>
            {/* Spine line */}
            <line x1="22" y1="10" x2="22" y2="30" stroke="#000000" strokeWidth="1.5"/>
            {/* Lines on left page */}
            <line x1="11" y1="14" x2="19" y2="14" stroke="#000000" strokeWidth="1"/>
            <line x1="11" y1="17" x2="19" y2="17" stroke="#000000" strokeWidth="1"/>
            <line x1="11" y1="20" x2="19" y2="20" stroke="#000000" strokeWidth="1"/>
            <line x1="11" y1="23" x2="17" y2="23" stroke="#000000" strokeWidth="1"/>
            {/* Arrow on right page */}
            <path d="M 28 19 L 34 25 M 34 25 L 28 31 M 34 25 L 36 25" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Dots below */}
            <circle cx="18" cy="36" r="2" fill="#000000"/>
            <circle cx="24" cy="36" r="2" fill="#000000"/>
            <circle cx="30" cy="36" r="2" fill="#000000" opacity="0.5"/>
          </svg>
          <span className="font-display text-2xl font-bold text-black">SpaceShift</span>
        </div>

        <div className="card">
          <h1 className="text-lg font-medium text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
              <input className="input" type="email" required placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input className="input pr-10" type={show ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-5">
            No account? <Link to="/register" className="text-gray-900 font-medium hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
