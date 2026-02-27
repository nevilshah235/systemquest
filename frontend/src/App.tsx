import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { MissionPage } from './pages/MissionPage';
import { ProgressPage } from './pages/ProgressPage';
import { Navbar } from './components/ui/Navbar';
import { ConceptAdvisorButton } from './components/concept/ConceptAdvisorButton';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

export const App: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {user && <Navbar />}
        <main className={user ? 'pt-14' : ''}>
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/mission/:slug" element={<ProtectedRoute><MissionPage /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to={user ? '/dashboard' : '/auth'} />} />
          </Routes>
        </main>
        {/* Persistent concept advisor button — available on all authenticated pages */}
        {user && <ConceptAdvisorButton />}
      </div>
    </BrowserRouter>
  );
};
