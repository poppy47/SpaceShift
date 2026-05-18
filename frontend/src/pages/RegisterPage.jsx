import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Step 1: Submit registration form and send OTP
  async function handleSubmitForm(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/register/initiate', form);
      setUserId(response.data.userId);
      setStep('otp');
      setResendTimer(60);
      
      // Countdown timer for resend
      const timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) clearInterval(timer);
          return Math.max(prev - 1, 0);
        });
      }, 1000);

      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register/verify', { userId, otp });
      const { user, accessToken, refreshToken } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Email verified! Welcome to SpaceShift!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    setLoading(true);
    try {
      await api.post('/auth/register/resend-otp', { userId });
      setOtp('');
      setResendTimer(60);

      // Countdown timer
      const timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) clearInterval(timer);
          return Math.max(prev - 1, 0);
        });
      }, 1000);

      toast.success('OTP resent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP.');
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
          {/* Step 1: Registration Form */}
          {step === 'form' && (
            <>
              <h1 className="text-lg font-medium text-gray-900 mb-1">Create account</h1>
              <p className="text-sm text-gray-500 mb-6">Join and book your study seat.</p>

              <form onSubmit={handleSubmitForm} className="space-y-4">
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
                  {loading ? 'Sending OTP…' : 'Continue'}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-5">
                Already have an account? <Link to="/login" className="text-gray-900 font-medium hover:underline">Sign in</Link>
              </p>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <>
              <div className="flex justify-center mb-4">
                <Mail className="w-12 h-12 text-blue-600" />
              </div>
              <h1 className="text-lg font-medium text-gray-900 mb-1 text-center">Verify email</h1>
              <p className="text-sm text-gray-500 mb-6 text-center">
                We sent a code to<br/><strong className="text-gray-700">{form.email}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Enter OTP</label>
                  <input 
                    className="input text-center text-2xl tracking-widest font-mono" 
                    type="text" 
                    placeholder="000000" 
                    maxLength="6"
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">6-digit code</p>
                </div>

                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full mt-2">
                  {loading ? 'Verifying…' : 'Verify & Sign up'}
                </button>
              </form>

              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  Resend OTP
                </button>
                {resendTimer > 0 && (
                  <span className="text-xs text-gray-400">in {resendTimer}s</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setStep('form'); setOtp(''); }}
                className="text-xs text-gray-500 hover:text-gray-700 w-full mt-3 py-2"
              >
                ← Change email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
