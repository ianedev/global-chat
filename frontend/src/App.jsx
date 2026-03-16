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
        <Route 
          path="/" 
          element={user ? <MapDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;
