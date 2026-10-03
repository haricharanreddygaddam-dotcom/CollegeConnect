import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  Award, TrendingUp, BookOpen, CheckCircle2, 
  BarChart3, FileSpreadsheet, PlusCircle, Sparkles 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import confetti from 'canvas-confetti';

export const MarksPage: React.FC = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Faculty Mark Entry form state
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [examType, setExamType] = useState<string>('Internal 1');
  const [maxMarks, setMaxMarks] = useState<number>(30.0);
  const [marksEntries, setMarksEntries] = useState<Record<number, { marks: number; remarks: string }>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMarksData();
  }, [user]);

  const loadMarksData = async () => {
    setLoading(true);
    try {
      const marksRes = await api.get('/marks');
      setMarks(marksRes.data);

      const subjRes = await api.get('/subjects');
      setSubjects(subjRes.data);
      if (subjRes.data.length > 0) {
        setSelectedSubject(subjRes.data[0].id);
      }

      if (user?.role !== 'student') {
        const studRes = await api.get('/students');
        setStudents(studRes.data);
        const initial: Record<number, { marks: number; remarks: string }> = {};
        studRes.data.forEach((s: any) => {
          initial[s.id] = { marks: 25.0, remarks: 'Consistent' };
        });
        setMarksEntries(initial);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedSubject) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      const payload = {
        subject_id: selectedSubject,
        exam_type: examType,
        max_marks: maxMarks,
        semester: 5,
        entries: Object.entries(marksEntries).map(([sId, data]) => ({
          student_id: parseInt(sId),
          marks_obtained: Number(data.marks),
          remarks: data.remarks
        }))
      };
      await api.post('/marks/bulk', payload);
      setSuccessMsg(`Marks successfully saved for ${examType}!`);
      confetti({ particleCount: 50, spread: 60 });
      loadMarksData();
    } catch (err) {
      alert('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  // Prepare chart data for student performance
  const chartData = marks.slice(0, 8).map((m) => ({
    name: m.subject_code || m.subject_name.substring(0, 10),
    exam: m.exam_type,
    percentage: m.percentage,
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Marks & Examination Results</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Continuous internal evaluation, laboratory assessments & semester end grades
          </p>
        </div>

        {user?.role === 'student' && (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Semester 5 SGPA</span>
              <span className="text-lg font-black text-indigo-700">8.92</span>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Cumulative CGPA</span>
              <span className="text-lg font-black text-emerald-700">{user.cgpa || 8.8}</span>
            </div>
          </div>
        )}
      </div>

      {/* Student View: Performance Chart & Subject Marks Cards */}
      {user?.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Performance Chart */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Exam Score Distribution (%)</h3>
              <p className="text-xs text-slate-500">Subject-wise percentage performance</p>
            </div>
            <div className="h-56 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="percentage" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2 mt-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Highest scoring subject: <strong>AI & Neural Networks (97%)</strong></span>
            </div>
          </div>

          {/* Marks Breakdown Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Semester 5 Continuous Evaluation Sheet</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Assessment Type</th>
                    <th className="pb-3">Marks</th>
                    <th className="pb-3">Score (%)</th>
                    <th className="pb-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marks.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-900">{m.subject_name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {m.exam_type}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-800">
                        {m.marks_obtained} <span className="text-slate-400 font-normal">/ {m.max_marks}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.percentage >= 85 ? 'bg-emerald-100 text-emerald-800' :
                          m.percentage >= 70 ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {m.percentage}%
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 italic text-[11px]">{m.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Faculty View: Mark Entry Portal */}
      {user?.role !== 'student' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Enter & Publish Student Marks</h3>
              <p className="text-xs text-slate-500">Record marks for internals, quizzes, and midterm assessments</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

              <select
                value={examType}
                onChange={(e) => {
                  setExamType(e.target.value);
                  setMaxMarks(e.target.value.includes('Mid') ? 50.0 : 30.0);
                }}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="Internal 1">Internal Assessment 1 (Max 30)</option>
                <option value="Internal 2">Internal Assessment 2 (Max 30)</option>
                <option value="Mid-Term Exam">Mid-Term Examination (Max 50)</option>
                <option value="Lab Evaluation">Lab Practical Exam (Max 25)</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span>Max Marks:</span>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                />
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Marks Obtained</th>
                  <th className="pb-3">Percentage</th>
                  <th className="pb-3">Remarks / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stud) => {
                  const entry = marksEntries[stud.id] || { marks: 0, remarks: '' };
                  const pct = maxMarks > 0 ? Math.round((entry.marks / maxMarks) * 100) : 0;
                  return (
                    <tr key={stud.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-900">{stud.name}</td>
                      <td className="py-3 font-mono text-slate-600">{stud.roll_number}</td>
                      <td className="py-3">
                        <input
                          type="number"
                          step="0.5"
                          max={maxMarks}
                          min={0}
                          value={entry.marks}
                          onChange={(e) => {
                            setMarksEntries({
                              ...marksEntries,
                              [stud.id]: { ...entry, marks: Number(e.target.value) }
                            });
                          }}
                          className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs focus:bg-white"
                        />
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pct >= 85 ? 'bg-emerald-100 text-emerald-800' :
                          pct >= 60 ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3">
                        <input
                          type="text"
                          value={entry.remarks}
                          onChange={(e) => {
                            setMarksEntries({
                              ...marksEntries,
                              [stud.id]: { ...entry, remarks: e.target.value }
                            });
                          }}
                          placeholder="e.g. Excellent work"
                          className="w-full max-w-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveMarks}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Publishing...' : 'Publish Marks'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
