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
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="8" height="16" fill="#1F2937" rx="1"/>
            <rect x="14" y="4" width="8" height="20" fill="#3B82F6" rx="1"/>
            <rect x="24" y="10" width="4" height="14" fill="#10B981" rx="1"/>
            <circle cx="8" cy="6" r="1.5" fill="#F59E0B"/>
            <circle cx="18" cy="2" r="1.5" fill="#F59E0B"/>
            <circle cx="28" cy="8" r="1.5" fill="#F59E0B"/>
          </svg>
          <span className="font-display text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">SpaceShift</span>
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

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Demo credentials</p>
            <p className="text-[11px] text-gray-500">Admin: admin@library.com / Admin@123</p>
            <p className="text-[11px] text-gray-500">Student: student@demo.com / Student@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
