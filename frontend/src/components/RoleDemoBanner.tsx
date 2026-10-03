import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, User, GraduationCap, School, Briefcase } from 'lucide-react';

export const RoleDemoBanner: React.FC = () => {
  const { user, switchDemoRole } = useAuth();

  const roles = [
    { key: 'student' as const, label: 'Student', icon: GraduationCap, color: 'bg-indigo-600 text-white hover:bg-indigo-700', activeRing: 'ring-2 ring-indigo-400 ring-offset-1' },
    { key: 'faculty' as const, label: 'Faculty', icon: Briefcase, color: 'bg-emerald-600 text-white hover:bg-emerald-700', activeRing: 'ring-2 ring-emerald-400 ring-offset-1' },
    { key: 'hod' as const, label: 'HOD', icon: School, color: 'bg-amber-600 text-white hover:bg-amber-700', activeRing: 'ring-2 ring-amber-400 ring-offset-1' },
    { key: 'admin' as const, label: 'Admin', icon: Shield, color: 'bg-purple-600 text-white hover:bg-purple-700', activeRing: 'ring-2 ring-purple-400 ring-offset-1' },
  ];

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Interactive Demo Mode — Live Role Switcher:
          </span>
          <span className="text-slate-400 hidden sm:inline">
            (Switch roles with 1 click to test permissions & workflows)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = user?.role === r.key;
            return (
              <button
                key={r.key}
                onClick={() => switchDemoRole(r.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all shadow-sm ${
                  isActive
                    ? `${r.color} ${r.activeRing} scale-105 shadow-md`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{r.label}</span>
                {isActive && <span className="ml-0.5 text-[10px] bg-black/25 px-1 py-0.2 rounded">Active</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
