import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/register', { username, password });
      navigate('/login');
    } catch (err) {
      setError('Username already exists');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] p-4 font-sans">
      <div className="w-full max-w-[400px] rounded-[24px] bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">Create Account</h1>
          <p className="mt-3 text-[15px] text-[#86868b]">Join the global map chat.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-[14px] text-red-600">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <input
              type="text"
              className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-3.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              placeholder="Pick a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-3.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-full bg-[#10b981] py-3.5 text-[15px] font-medium text-white hover:bg-[#059669] active:bg-[#047857] transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-[14px] text-[#86868b]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#10b981] hover:underline">
            Sign in.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
