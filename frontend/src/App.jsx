import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MapDashboard from './pages/MapDashboard';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Default Guest User
      setUser({ id: 999, username: 'Guest' });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Re-set guest on logout for this "no-login" mode
    setUser({ id: 999, username: 'Guest' });
  };

  return (
    <div className="h-screen w-full bg-slate-900 text-white">
      <Routes>
        <Route path="/" element={<MapDashboard user={user || { id: 999, username: 'Guest' }} onLogout={handleLogout} />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/register" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
