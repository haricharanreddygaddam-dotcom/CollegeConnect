import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  CalendarCheck, Award, FileText, Bell, Users, Building2,
  CalendarDays, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, ArrowUpRight, PlusCircle, QrCode, FileCheck2, PlaneTakeoff,
  Sparkles, BookOpen, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { QRScannerModal } from '../components/QRScannerModal';

export const Dashboard: React.FC = () => {
  const { user, switchDemoRole } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = days[new Date().getDay()] || 'Monday';

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/analytics/dashboard');
      setStats(statsRes.data);

      if (user?.role === 'student' && user.student_id) {
        const attRes = await api.get(`/attendance/stats/student/${user.student_id}`);
        setStudentStats(attRes.data);

        const ttRes = await api.get(`/timetable?day_of_week=${todayDayName === 'Sunday' ? 'Monday' : todayDayName}`);
        setTodayClasses(ttRes.data);

        const assignRes = await api.get('/assignments');
        setAssignments(assignRes.data);
      } else {
        const ttRes = await api.get(`/timetable?day_of_week=Monday`);
        setTodayClasses(ttRes.data);
        const assignRes = await api.get('/assignments');
        setAssignments(assignRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const overallAttendance = studentStats.length > 0
    ? Math.round(studentStats.reduce((acc, s) => acc + s.percentage, 0) / studentStats.length)
    : 88;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-sm">
                Academic Session 2026–2027
              </span>
              <span className="text-xs text-indigo-300 font-medium">Semester 5</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || 'Academician'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-normal">
              {user?.role === 'student' && "Here's an overview of today's schedule, attendance health, assignments, and campus notices."}
              {user?.role === 'faculty' && "Manage your lecture attendance via live QR codes, review student assignment submissions, and enter marks."}
              {(user?.role === 'hod' || user?.role === 'admin') && "Real-time institutional oversight across student attendance, faculty workload, approvals, and notices."}
            </p>
          </div>

          {/* Quick Action Widget */}
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'student' && (
              <button
                onClick={() => setQrModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-xs shadow-lg hover:bg-indigo-50 hover:scale-105 transition-all"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>Scan QR Attendance</span>
              </button>
            )}

            {user?.role === 'faculty' && (
              <Link
                to="/attendance"
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-lg hover:bg-emerald-600 hover:scale-105 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Launch QR Attendance</span>
              </Link>
            )}

            {(user?.role === 'admin' || user?.role === 'hod') && (
              <Link
                to="/certificates"
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs shadow-lg hover:bg-amber-600 hover:scale-105 transition-all"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Review Certificates ({stats?.pending_certificates || 0})</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {user?.role === 'student' ? 'Overall Attendance' : 'Total Students'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              {user?.role === 'student' ? <CalendarCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {user?.role === 'student' ? `${overallAttendance}%` : stats?.total_students || 2450}
            </span>
            {user?.role === 'student' && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                overallAttendance >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {overallAttendance >= 75 ? 'Eligible' : 'Low Alert'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {user?.role === 'student' ? 'Minimum 75% required for exams' : 'Active enrolled in 4 branches'}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {user?.role === 'student' ? 'Cumulative GPA' : 'Faculty Strength'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              {user?.role === 'student' ? <Award className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {user?.role === 'student' ? (user.cgpa || 8.8) : stats?.total_faculty || 156}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {user?.role === 'student' ? 'Top 5%' : '1:15 Ratio'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {user?.role === 'student' ? 'Semester 1 to 4 consolidated' : 'Across 12 specialized departments'}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {user?.role === 'student' ? 'Pending Tasks' : 'Leave Requests'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              {user?.role === 'student' ? <FileText className="w-5 h-5" /> : <PlaneTakeoff className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {user?.role === 'student' ? '2 Pending' : `${stats?.pending_leaves || 0} Pending`}
            </span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Action Req
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {user?.role === 'student' ? 'FastAPI REST API due in 5 days' : 'Awaiting HOD verification'}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {user?.role === 'student' ? 'Upcoming Events' : 'Avg Attendance'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              {user?.role === 'student' ? <CalendarDays className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {user?.role === 'student' ? '3 Events' : `${stats?.average_attendance || 88.5}%`}
            </span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Campus
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {user?.role === 'student' ? 'TechFest 2026 in 12 days' : 'Weekly consolidated campus rate'}
          </p>
        </div>

      </div>

      {/* Main Content Split: Charts & Timelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Dynamic Charts or Subject breakdown */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Institutional / Role Charts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {user?.role === 'student' ? 'Subject Attendance Breakdown' : 'Weekly Attendance & Activity Analytics'}
                </h3>
                <p className="text-xs text-slate-500">
                  {user?.role === 'student' ? 'Real-time percentage per registered course' : 'Daily campus-wide student participation statistics'}
                </p>
              </div>
              <Link to="/attendance" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                <span>View Full Attendance</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {user?.role === 'student' ? (
              <div className="space-y-4 pt-2">
                {studentStats.map((subj) => (
                  <div key={subj.subject_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{subj.subject_name} ({subj.subject_code})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{subj.attended_classes}/{subj.total_classes} classes</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md ${
                          subj.percentage >= 85 ? 'bg-emerald-50 text-emerald-700' :
                          subj.percentage >= 75 ? 'bg-indigo-50 text-indigo-700' :
                          'bg-rose-50 text-rose-700 font-extrabold'
                        }`}>
                          {subj.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          subj.percentage >= 85 ? 'bg-emerald-500' :
                          subj.percentage >= 75 ? 'bg-indigo-500' :
                          'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, subj.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.attendance_trend || []}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[70, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Assignments Workspace Overview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Course Assignments & Tasks</h3>
                <p className="text-xs text-slate-500">Upcoming deliverables and practical submissions</p>
              </div>
              <Link to="/assignments" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                <span>All Assignments</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {assignments.slice(0, 3).map((a) => (
                <div key={a.id} className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                        {a.subject_name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Max: {a.max_marks} Marks</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{a.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-1">{a.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      a.my_submission?.status === 'Evaluated' ? 'bg-emerald-100 text-emerald-700' :
                      a.my_submission?.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {a.my_submission ? a.my_submission.status : 'Pending'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Today's Schedule & Live Notices Feed */}
        <div className="space-y-6">
          
          {/* Today's Timetable Feed */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Today's Lectures</h3>
                  <p className="text-[11px] text-slate-500">{todayDayName}'s Schedule</p>
                </div>
              </div>
              <Link to="/timetable" className="text-xs text-indigo-600 font-bold hover:underline">
                Full Week
              </Link>
            </div>

            <div className="space-y-3">
              {todayClasses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No classes scheduled for today
                </div>
              ) : (
                todayClasses.map((cls, idx) => (
                  <div 
                    key={cls.id || idx}
                    className="relative pl-4 border-l-2 border-indigo-500 py-1 space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-600 font-mono">{cls.start_time} – {cls.end_time}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{cls.room_number}</span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{cls.subject_name}</p>
                    <p className="text-[11px] text-slate-500">{cls.faculty_name || 'Faculty'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Official Notices */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Official Notices</h3>
                  <p className="text-[11px] text-slate-500">Dean & Department Bulletins</p>
                </div>
              </div>
              <Link to="/notices" className="text-xs text-indigo-600 font-bold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {(stats?.recent_notices || []).slice(0, 3).map((notice: any) => (
                <div key={notice.id} className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${
                      notice.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {notice.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(notice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs leading-snug">{notice.title}</h5>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* QR Scanner Modal for Students */}
      <QRScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onSuccess={() => {
          setQrModalOpen(false);
          fetchDashboardData();
        }}
      />

    </div>
  );
};
