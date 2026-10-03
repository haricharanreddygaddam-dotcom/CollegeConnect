import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Award,
  Calendar,
  FileText,
  Bell,
  CalendarDays,
  PlaneTakeoff,
  FileCheck2,
  MessageSquareHeart,
  Users,
  Building2,
  BookOpen,
  QrCode,
  Sparkles,
  BarChart3,
  UserCheck
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['student', 'faculty', 'hod', 'admin'] },
  { label: 'Attendance', path: '/attendance', icon: CalendarCheck, roles: ['student', 'faculty', 'hod', 'admin'], badge: 'Live QR' },
  { label: 'Marks & Results', path: '/marks', icon: Award, roles: ['student', 'faculty', 'hod', 'admin'] },
  { label: 'Timetable', path: '/timetable', icon: Calendar, roles: ['student', 'faculty', 'hod', 'admin'] },
  { label: 'Assignments', path: '/assignments', icon: FileText, roles: ['student', 'faculty', 'hod', 'admin'] },
  { label: 'Notices Board', path: '/notices', icon: Bell, roles: ['student', 'faculty', 'hod', 'admin'] },
  { label: 'Campus Events', path: '/events', icon: CalendarDays, roles: ['student', 'faculty', 'hod', 'admin'] },
  { label: 'Leave Requests', path: '/leaves', icon: PlaneTakeoff, roles: ['student', 'faculty', 'hod', 'admin'] },
  { label: 'Certificates', path: '/certificates', icon: FileCheck2, roles: ['student', 'faculty', 'hod', 'admin'], badge: 'QR Auth' },
  { label: 'Feedback', path: '/feedback', icon: MessageSquareHeart, roles: ['student', 'faculty', 'hod', 'admin'] },
  // Admin & Management Specific
  { label: 'Students Directory', path: '/directory/students', icon: Users, roles: ['faculty', 'hod', 'admin'] },
  { label: 'Faculty Directory', path: '/directory/faculty', icon: UserCheck, roles: ['hod', 'admin'] },
  { label: 'Departments', path: '/directory/departments', icon: Building2, roles: ['admin', 'hod'] },
  { label: 'Subjects & Curriculum', path: '/directory/subjects', icon: BookOpen, roles: ['admin', 'hod'] },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const currentRole = user?.role || 'student';

  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem-37px)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {currentRole.toUpperCase()} PORTAL
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
              v1.0
            </span>
          </div>

          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 font-bold'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* College Info Widget */}
      <div className="mt-8 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-100/80">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">CampusConnect v1.0</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Centralized academic automation system with QR-verified records.
        </p>
      </div>
    </aside>
  );
};
