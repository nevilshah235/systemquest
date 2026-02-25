import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 group">
          <span className="text-xl font-black text-white group-hover:text-brand-400 transition-colors">
            System<span className="text-brand-500">Quest</span>
          </span>
        </button>

        {/* Nav links */}
        <div className="flex items-center gap-1 text-sm">
          {[
            { path: '/dashboard', label: 'Missions' },
            { path: '/progress', label: 'Progress' },
          ].map(({ path, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                location.pathname === path
                  ? 'bg-brand-900/50 text-brand-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.level}
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-none">{user.username}</div>
                  <div className="text-xs text-amber-400 leading-none mt-0.5">{user.xp} XP</div>
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost text-xs">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
