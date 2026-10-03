import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import { Users, Building2, BookOpen, UserCheck, PlusCircle, Search, Mail, Phone, MapPin, X } from 'lucide-react';

export const DirectoriesPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const [activeTab, setActiveTab] = useState<'students' | 'faculty' | 'departments' | 'subjects'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (path.includes('faculty')) setActiveTab('faculty');
    else if (path.includes('departments')) setActiveTab('departments');
    else if (path.includes('subjects')) setActiveTab('subjects');
    else setActiveTab('students');
  }, [path]);

  useEffect(() => {
    loadDirectoryData();
  }, [activeTab]);

  const loadDirectoryData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'students') {
        const res = await api.get('/students');
        setStudents(res.data);
      } else if (activeTab === 'faculty') {
        const res = await api.get('/faculty');
        setFaculty(res.data);
      } else if (activeTab === 'departments') {
        const res = await api.get('/departments');
        setDepartments(res.data);
      } else if (activeTab === 'subjects') {
        const res = await api.get('/subjects');
        setSubjects(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Institutional Directories & Records</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete database of enrolled students, faculty staff, academic departments & syllabus
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'students' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'faculty' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'departments' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'subjects' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subjects
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Directory Content */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_number.toLowerCase().includes(search.toLowerCase())).map((s) => (
            <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-center gap-3">
                <img src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=4f46e5&color=fff`} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-100" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                  <p className="text-xs font-mono font-bold text-indigo-600">{s.roll_number}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <strong className="text-slate-800">{s.department_name} (Sec {s.section})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Year / Sem:</span>
                  <span className="font-semibold text-slate-700">Year {s.year} • Sem {s.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CGPA:</span>
                  <strong className="text-emerald-600 font-bold">{s.cgpa}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-[11px] truncate max-w-[150px]">{s.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'faculty' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculty.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.employee_id.toLowerCase().includes(search.toLowerCase())).map((f) => (
            <div key={f.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-center gap-3">
                <img src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=10b981&color=fff`} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-100" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{f.name}</h3>
                  <p className="text-xs font-bold text-emerald-600">{f.designation}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee ID:</span>
                  <strong className="font-mono text-slate-800">{f.employee_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <strong className="text-slate-800">{f.department_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Experience:</span>
                  <span className="font-semibold text-slate-700">{f.experience_years} Years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Office:</span>
                  <span className="text-slate-700">{f.office_room}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((d) => (
            <div key={d.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black uppercase">
                  {d.code}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{d.building}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{d.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subj) => (
            <div key={subj.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {subj.code}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {subj.credits} Credits
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">{subj.name}</h3>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p>Instructor: <strong className="text-slate-800">{subj.faculty_name || 'Prof. David Thorne'}</strong></p>
                <p>Department: <strong className="text-slate-800">{subj.department_name}</strong> • Sem {subj.semester}</p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
