import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  CalendarCheck, QrCode, CheckCircle2, XCircle, Clock,
  AlertTriangle, Filter, Sparkles, RefreshCw, Users, ShieldCheck, ChevronRight
} from 'lucide-react';
import { QRScannerModal } from '../components/QRScannerModal';
import confetti from 'canvas-confetti';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Faculty Live QR State
  const [activeSession, setActiveSession] = useState<any>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  // Faculty Manual Marking State
  const [rosterStudents, setRosterStudents] = useState<any[]>([]);
  const [markDate, setMarkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rosterStatus, setRosterStatus] = useState<Record<number, string>>({});
  const [savingBulk, setSavingBulk] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const subjRes = await api.get('/subjects');
      setSubjects(subjRes.data);
      if (subjRes.data.length > 0) {
        setSelectedSubject(subjRes.data[0].id);
      }

      if (user?.role === 'student' && user.student_id) {
        const statsRes = await api.get(`/attendance/stats/student/${user.student_id}`);
        setStats(statsRes.data);
      }

      const recRes = await api.get('/attendance/records');
      setRecords(recRes.data);

      if (user?.role !== 'student') {
        const studRes = await api.get('/students');
        setRosterStudents(studRes.data);
        const initialStatus: Record<number, string> = {};
        studRes.data.forEach((s: any) => {
          initialStatus[s.id] = 'Present';
        });
        setRosterStatus(initialStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQRSession = async () => {
    if (!selectedSubject) return;
    setCreatingSession(true);
    try {
      const res = await api.post('/attendance/sessions', {
        subject_id: selectedSubject,
        date: markDate,
        expires_in_minutes: 20
      });
      setActiveSession(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start session');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleSaveBulkAttendance = async () => {
    if (!selectedSubject) return;
    setSavingBulk(true);
    setSaveMessage(null);
    try {
      const payload = {
        subject_id: selectedSubject,
        date: markDate,
        records: Object.entries(rosterStatus).map(([sId, status]) => ({
          student_id: parseInt(sId),
          status: status
        }))
      };
      const res = await api.post('/attendance/mark-bulk', payload);
      setSaveMessage(res.data.message);
      confetti({ particleCount: 50, spread: 60 });
      loadData();
    } catch (err: any) {
      alert('Failed to save attendance');
    } finally {
      setSavingBulk(false);
    }
  };

  const setAllStatus = (status: string) => {
    const updated: Record<number, string> = {};
    rosterStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setRosterStatus(updated);
  };

  const calculateNeededClasses = (attended: number, total: number) => {
    // formula for 75%: (attended + x) / (total + x) >= 0.75 => x >= 3*total - 4*attended
    const needed = Math.max(0, 3 * total - 4 * attended);
    return needed;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Attendance Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'student' 
              ? 'Real-time subject attendance tracking, QR check-in & eligibility analysis'
              : 'Digital attendance roster, live QR code generation & automated records'}
          </p>
        </div>

        {user?.role === 'student' ? (
          <button
            onClick={() => setQrModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateQRSession}
              disabled={creatingSession || !selectedSubject}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>{creatingSession ? 'Launching...' : 'Generate Live QR Session'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Active QR Session Display (Faculty View) */}
      {activeSession && user?.role !== 'student' && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-500/30 animate-slide-up flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-lg text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live QR Attendance Session Active
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{activeSession.subject_name}</h2>
            <p className="text-xs text-indigo-200">
              Project this QR Code or share the secure token with students in lecture. Code expires in 20 minutes.
            </p>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm inline-block font-mono text-xs">
              Passcode Token: <strong className="text-amber-300 text-sm ml-1">{activeSession.qr_token}</strong>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-indigo-400 flex flex-col items-center">
            {/* Display Simulated High-contrast QR visual */}
            <div className="w-44 h-44 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:12px_12px] opacity-80" />
              <div className="relative z-10 w-24 h-24 bg-white rounded-lg p-2 flex items-center justify-center text-slate-900">
                <QrCode className="w-20 h-20 text-indigo-900" />
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-600 mt-2 font-mono">
              Scan to Mark Present
            </span>
          </div>
        </div>
      )}

      {/* Student View: Subject-wise Cards & Attendance Calculator */}
      {user?.role === 'student' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((subj) => {
              const needed = calculateNeededClasses(subj.attended_classes, subj.total_classes);
              return (
                <div 
                  key={subj.subject_id} 
                  className={`bg-white p-6 rounded-3xl border transition-all hover:shadow-md ${
                    subj.is_warning ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {subj.subject_code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">{subj.subject_name}</h3>
                    </div>
                    <span className={`text-sm font-black px-2.5 py-1 rounded-xl ${
                      subj.percentage >= 85 ? 'bg-emerald-100 text-emerald-800' :
                      subj.percentage >= 75 ? 'bg-indigo-100 text-indigo-800' :
                      'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {subj.percentage}%
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Attended: <strong>{subj.attended_classes}</strong> / {subj.total_classes}</span>
                      <span>Missed: <strong className="text-rose-600">{subj.missed_classes}</strong></span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
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

                  {/* Warning / Status Helper */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                    {subj.is_warning ? (
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Attendance below 75%! Need {needed} consecutive classes.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Safe attendance status for semester exam eligibility.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Faculty View: Manual Roster Marking */}
      {user?.role !== 'student' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Lecture Attendance Roster</h3>
              <p className="text-xs text-slate-500">Take manual attendance or override digital records</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Subject picker */}
              <select
                value={selectedSubject || ''}
                onChange={(e) => setSelectedSubject(Number(e.target.value))}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>

              {/* Date picker */}
              <input
                type="date"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />

              {/* 1-Click helpers */}
              <button
                onClick={() => setAllStatus('Present')}
                className="text-xs px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 transition-colors"
              >
                All Present
              </button>
              <button
                onClick={() => setAllStatus('Absent')}
                className="text-xs px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition-colors"
              >
                All Absent
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Student Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rosterStudents.map((stud) => {
                  const currentStatus = rosterStatus[stud.id] || 'Present';
                  return (
                    <tr key={stud.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-900 flex items-center gap-2.5">
                        <img 
                          src={stud.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(stud.name)}&background=4f46e5&color=fff`} 
                          alt="" 
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span>{stud.name}</span>
                      </td>
                      <td className="py-3 font-mono text-slate-600 font-semibold">{stud.roll_number}</td>
                      <td className="py-3 text-slate-500">{stud.department_name || 'CSE'} - Sec {stud.section}</td>
                      <td className="py-3 text-right">
                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1">
                          {['Present', 'Absent', 'Late'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setRosterStatus({ ...rosterStatus, [stud.id]: st })}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === st
                                  ? st === 'Present' ? 'bg-emerald-600 text-white shadow-sm'
                                    : st === 'Absent' ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-amber-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveBulkAttendance}
              disabled={savingBulk}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingBulk ? 'Saving...' : 'Submit Lecture Attendance'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Historical Records Log */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Recent Attendance Records Log</h3>
          <span className="text-xs text-slate-400 font-mono">Total {records.length} Recorded Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                <th className="pb-3">Date</th>
                <th className="pb-3">Subject</th>
                <th className="pb-3">Student</th>
                <th className="pb-3">Method</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.slice(0, 10).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 font-mono text-slate-600">{r.date}</td>
                  <td className="py-2.5 font-bold text-slate-900">{r.subject_name}</td>
                  <td className="py-2.5 text-slate-600">{r.student_name} ({r.student_roll})</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {r.method}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'Late' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onSuccess={() => {
          setQrModalOpen(false);
          loadData();
        }}
      />

    </div>
  );
};
