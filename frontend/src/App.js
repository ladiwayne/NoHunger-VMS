import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/authContext';
import { PrivateRoute } from './utils/PrivateRoute';
import { LoginPage, RegisterPage } from './pages/Auth';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import './App.css';

const AppContent = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      {user && (
        <nav className="navbar">
          <div className="navbar-brand">No Hunger VMS</div>
          <div className="navbar-user">
            <span>{user.firstName} {user.lastName}</span>
            <button onClick={logout} className="btn-logout">Logout</button>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              {user?.role === 'admin' ? <AdminDashboard /> : <VolunteerDashboard />}
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
