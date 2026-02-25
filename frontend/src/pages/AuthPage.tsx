import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuthStore } from '../stores/authStore';

export const AuthPage: React.FC = () => {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 items-center justify-center p-12 border-r border-gray-800">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6 animate-float">🏗️</div>
          <h1 className="text-4xl font-black text-white mb-4">
            System<span className="text-brand-400">Quest</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Master system architecture through gamified missions. Design, simulate, and level up.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '🚀', label: '3 Missions' },
              { icon: '⭐', label: '950 XP' },
              { icon: '🏆', label: 'Achievements' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {mode === 'login'
          ? <LoginForm onSwitch={() => setMode('register')} />
          : <RegisterForm onSwitch={() => setMode('login')} />
        }
      </div>
    </div>
  );
};
