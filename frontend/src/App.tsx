import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { MissionPage } from './pages/MissionPage';
import { ProgressPage } from './pages/ProgressPage';
import { Navbar } from './components/dashboard/Navbar';
import { useAuthStore } from './stores/authStore';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, _hasHydrated } = useAuthStore();
  // Wait for persisted auth state to rehydrate before deciding to redirect
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-pulse">🏗️</div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      {children}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/mission/:slug" element={<ProtectedLayout><MissionPage /></ProtectedLayout>} />
        <Route path="/progress" element={<ProtectedLayout><ProgressPage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
