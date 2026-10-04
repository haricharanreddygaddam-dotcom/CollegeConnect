import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Building2, BookOpen, UserCheck, Users, Plus, Pencil, Power, X } from 'lucide-react';

type Tab = 'students' | 'faculty' | 'departments' | 'subjects';

const empty = { name: '', email: '', password: '', roll_number: '', employee_id: '', department_id: '', year: '3', semester: '5', section: 'A', phone: '', address: '', parent_name: '', parent_phone: '', admission_year: '2023', cgpa: '8.5', designation: 'Assistant Professor', experience_years: '5', office_room: '', qualification: 'M.Tech / Ph.D', code: '', description: '', building: '', hod_id: '', credits: '4', faculty_id: '' };

export const AdminManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('students');
  const [rows, setRows] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [deptRes, facRes] = await Promise.all([api.get('/departments'), api.get('/faculty')]);
      setDepartments(deptRes.data);
      setFaculty(facRes.data);
      const endpoint = tab === 'faculty' ? '/faculty' : tab === 'departments' ? '/departments' : tab === 'subjects' ? '/subjects' : '/students';
      const res = await api.get(endpoint);
      setRows(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Unable to load administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [tab, isAdmin]);

  const openCreate = () => { setEditing(null); setForm({ ...empty }); setShowForm(true); setError(''); setMessage(''); };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ ...empty, ...row, department_id: row.department_id?.toString() || '', faculty_id: row.faculty_id?.toString() || '', hod_id: row.hod_id?.toString() || '', credits: row.credits?.toString() || '4', semester: row.semester?.toString() || '5', year: row.year?.toString() || '3', admission_year: row.admission_year?.toString() || '2023', cgpa: row.cgpa?.toString() || '8.5', experience_years: row.experience_years?.toString() || '5', password: '' });
    setShowForm(true); setError(''); setMessage('');
  };

  const set = (key: string, value: string) => setForm((v: any) => ({ ...v, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    try {
      let payload: any;
      let endpoint = '';
      if (tab === 'departments') {
        endpoint = editing ? `/departments/${editing.id}` : '/departments';
        payload = { name: form.name, code: form.code, description: form.description || null, building: form.building || null, hod_id: form.hod_id ? Number(form.hod_id) : null };
      } else if (tab === 'subjects') {
        endpoint = editing ? `/subjects/${editing.id}` : '/subjects';
        payload = { name: form.name, code: form.code, credits: Number(form.credits), department_id: Number(form.department_id), semester: Number(form.semester), faculty_id: form.faculty_id ? Number(form.faculty_id) : null };
      } else if (tab === 'students') {
        endpoint = editing ? `/students/${editing.id}` : '/students';
        payload = { name: form.name, email: form.email, roll_number: form.roll_number, department_id: Number(form.department_id), year: Number(form.year), semester: Number(form.semester), section: form.section, phone: form.phone || null, address: form.address || null, parent_name: form.parent_name || null, parent_phone: form.parent_phone || null, admission_year: Number(form.admission_year), cgpa: Number(form.cgpa) };
        if (form.password) payload.password = form.password;
        if (!editing) payload.password = form.password || 'Student@123';
      } else {
        endpoint = editing ? `/faculty/${editing.id}` : '/faculty';
        payload = { name: form.name, email: form.email, employee_id: form.employee_id, department_id: Number(form.department_id), designation: form.designation, experience_years: Number(form.experience_years), phone: form.phone || null, office_room: form.office_room || null, qualification: form.qualification };
        if (form.password) payload.password = form.password;
        if (!editing) payload.password = form.password || 'Faculty@123';
      }
      if (editing) await api.put(endpoint, payload); else await api.post(endpoint, payload);
      setMessage(editing ? 'Record updated successfully.' : 'Record created successfully.');
      setEditing(null); setForm({ ...empty }); setShowForm(false); await load();
    } catch (e: any) { setError(e?.response?.data?.detail || 'Save failed.'); }
  };

  const deactivate = async (row: any) => {
    if (!window.confirm(`Deactivate ${row.name}? They will no longer be able to sign in.`)) return;
    try {
      await api.delete(`/${tab}/${row.id}`);
      setMessage(`${row.name} was deactivated.`); await load();
    } catch (e: any) { setError(e?.response?.data?.detail || 'Operation failed.'); }
  };

  const deleteSimple = async (row: any) => {
    if (!window.confirm(`Delete ${row.name || row.code}? This is permanent.`)) return;
    try {
      await api.delete(`/${tab}/${row.id}`);
      setMessage('Record deleted.'); await load();
    } catch (e: any) { setError(e?.response?.data?.detail || 'Delete failed.'); }
  };

  const filteredRows = useMemo(() => rows, [rows]);
  if (!isAdmin) return <div className="p-8 bg-white rounded-3xl border border-slate-200">Admin access required.</div>;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'students', label: 'Students', icon: Users }, { key: 'faculty', label: 'Faculty', icon: UserCheck },
    { key: 'departments', label: 'Departments', icon: Building2 }, { key: 'subjects', label: 'Subjects', icon: BookOpen },
  ];

  const field = (key: string, label: string, type = 'text', required = false) => (
    <label className="space-y-1 block"><span className="text-[11px] font-bold text-slate-500">{label}</span><input type={type} required={required} value={form[key] || ''} onChange={e => set(key, e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></label>
  );

  return <div className="space-y-6 pb-12">
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h1 className="text-2xl font-black text-slate-900">Administration & Management</h1><p className="text-xs text-slate-500 mt-1">Create, edit and deactivate institutional records.</p></div>
      <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add {tab.slice(0, -1)}</button>
    </div>
    {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}
    {message && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{message}</div>}
    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">{tabs.map(t => { const Icon=t.icon; return <button key={t.key} onClick={() => {setTab(t.key); setEditing(null); setForm(empty)}} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${tab===t.key?'bg-white shadow text-indigo-700':'text-slate-600'}`}><Icon className="w-4 h-4"/>{t.label}</button>})}</div>

    {loading ? <div className="p-12 text-center text-slate-500">Loading...</div> : <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="p-4">Record</th><th className="p-4">Details</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{filteredRows.map(row => <tr key={row.id} className="border-t border-slate-100"><td className="p-4"><div className="font-bold text-sm text-slate-900">{row.name || row.code}</div><div className="text-xs text-slate-500">{row.email || row.code || `ID ${row.id}`}</div></td><td className="p-4 text-xs text-slate-600">{tab==='students' ? `${row.roll_number} • ${row.department_name || 'No department'}` : tab==='faculty' ? `${row.employee_id} • ${row.department_name || 'No department'}` : tab==='departments' ? `${row.code} • ${row.building || 'No building'}` : `${row.credits} credits • Sem ${row.semester}`}</td><td className="p-4">{tab==='students'||tab==='faculty' ? <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${row.is_active?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{row.is_active?'Active':'Inactive'}</span> : <span className="text-xs text-emerald-600 font-bold">Configured</span>}</td><td className="p-4"><div className="flex justify-end gap-2"><button onClick={()=>openEdit(row)} className="p-2 rounded-lg bg-indigo-50 text-indigo-700" title="Edit"><Pencil className="w-4 h-4"/></button>{tab==='students'||tab==='faculty' ? <button disabled={!row.is_active} onClick={()=>deactivate(row)} className="p-2 rounded-lg bg-amber-50 text-amber-700 disabled:opacity-40" title="Deactivate"><Power className="w-4 h-4"/></button> : <button onClick={()=>deleteSimple(row)} className="p-2 rounded-lg bg-rose-50 text-rose-700" title="Delete"><X className="w-4 h-4"/></button>}</div></td></tr>)}</tbody></table></div></div>}

    {showForm && <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 flex items-center justify-center"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="p-5 border-b border-slate-100 flex justify-between"><div><h2 className="font-black text-lg">{editing?'Edit':'Create'} {tab.slice(0,-1)}</h2><p className="text-xs text-slate-500">Admin-only operation</p></div><button onClick={()=>{setEditing(null);setForm({ ...empty });setShowForm(false)}}><X/></button></div><form onSubmit={submit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tab==='students' && <>{field('name','Name','text',true)}{field('email','Email','email',true)}{field('password','Password','password')}{field('roll_number','Roll Number','text',true)}{field('department_id','Department ID','number',true)}{field('year','Year','number',true)}{field('semester','Semester','number',true)}{field('section','Section','text',true)}{field('phone','Phone')}{field('address','Address')}{field('parent_name','Parent Name')}{field('parent_phone','Parent Phone')}{field('admission_year','Admission Year','number')}{field('cgpa','CGPA','number')}</>}
      {tab==='faculty' && <>{field('name','Name','text',true)}{field('email','Email','email',true)}{field('password','Password','password')}{field('employee_id','Employee ID','text',true)}{field('department_id','Department ID','number',true)}{field('designation','Designation','text',true)}{field('experience_years','Experience (years)','number')}{field('phone','Phone')}{field('office_room','Office Room')}{field('qualification','Qualification')}</>}
      {tab==='departments' && <>{field('name','Name','text',true)}{field('code','Code','text',true)}{field('building','Building')}{field('hod_id','HOD User ID','number')}{field('description','Description')}</>}
      {tab==='subjects' && <>{field('name','Name','text',true)}{field('code','Code','text',true)}{field('credits','Credits','number',true)}{field('department_id','Department ID','number',true)}{field('semester','Semester','number',true)}{field('faculty_id','Faculty ID','number')}</>}
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={()=>{setEditing(null);setForm({ ...empty });setShowForm(false)}} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">Cancel</button><button type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">{editing?'Save Changes':'Create Record'}</button></div>
    </form></div></div>}
  </div>;
};
