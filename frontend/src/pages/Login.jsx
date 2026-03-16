import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

// Ensure Remix Icon CSS is in your index.html
// <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">

const ACCENT_BLUE = '#0052FF'; // Precision blue

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.userId, username: data.username }));
      setUser({ id: data.userId, username: data.username });
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-6 font-sans antialiased text-[#121212]">
      <div className="w-full max-w-[340px] rounded-xl border border-slate-200 bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="inline-flex mb-6 h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            <i className="ri-login-box-line text-xl"></i>
          </div>
          <h1 className="text-[18px] font-black tracking-tight text-slate-900 uppercase">
            Sign In
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            MapChat Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-[12px] font-medium text-red-600">
              <i className="ri-error-warning-line mr-2"></i>
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity</label>
              <div className="group relative flex items-center">
                <i className="ri-user-3-line absolute left-3.5 text-slate-300 transition-colors group-focus-within:text-blue-600"></i>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-[13px] transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Key</label>
              <div className="group relative flex items-center">
                <i className="ri-lock-2-line absolute left-3.5 text-slate-300 transition-colors group-focus-within:text-blue-600"></i>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-[13px] transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: ACCENT_BLUE }}
            className="mt-4 w-full rounded-lg py-3 text-[12px] font-black uppercase tracking-widest text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Authorize'}
          </button>
        </form>

        <div className="mt-10 border-t border-slate-100 pt-6 text-center">
          <p className="text-[12px] text-slate-400 font-medium">
            No account yet?{' '}
            <Link to="/register" className="font-bold text-slate-900 transition-colors hover:text-blue-600">
              Register.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;