import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Bell, PlusCircle, Search, Filter, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export const NoticesPage: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New notice modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Academic');
  const [priority, setPriority] = useState('Normal');
  const [targetRole, setTargetRole] = useState('All');
  const [publishing, setPublishing] = useState(false);

  const categories = ['All', 'Academic', 'Examination', 'Events', 'Department', 'General', 'Emergency'];

  useEffect(() => {
    loadNotices();
  }, [user, activeCategory]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notices?category=${activeCategory}`);
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNotice = async () => {
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    try {
      await api.post('/notices', {
        title,
        content,
        category,
        priority,
        target_role: targetRole
      });
      confetti({ particleCount: 50, spread: 60 });
      setShowModal(false);
      setTitle('');
      setContent('');
      loadNotices();
    } catch (err) {
      alert('Failed to publish notice');
    } finally {
      setPublishing(false);
    }
  };

  const filteredNotices = notices.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Notices & Campus Circulars</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified institutional broadcasts, administrative announcements & examination schedules
          </p>
        </div>

        {user?.role !== 'student' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeCategory === cat ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars..."
            className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 text-xs">
            No notices found matching current filters.
          </div>
        ) : (
          filteredNotices.map((n) => (
            <div
              key={n.id}
              className={`bg-white p-6 rounded-3xl border transition-all hover:shadow-md space-y-3 ${
                n.priority === 'Urgent' ? 'border-rose-300 bg-gradient-to-r from-rose-50/20 via-white to-white' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    n.category === 'Examination' ? 'bg-purple-100 text-purple-700' :
                    n.category === 'Events' ? 'bg-emerald-100 text-emerald-700' :
                    n.category === 'Emergency' ? 'bg-rose-100 text-rose-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {n.category}
                  </span>

                  {n.priority === 'Urgent' && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Urgent Notice
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 font-medium">
                    Target: <strong>{n.target_role}</strong>
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-400">
                  {new Date(n.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{n.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Published by: <strong className="text-slate-800">{n.author_name}</strong></span>
                <span>Department: <strong className="text-slate-800">{n.department_name}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Publish Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Publish New Official Circular</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notice Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. End-Semester Lab Practical Schedule & Viva Voce"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Content</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write notice instructions, dates, guidelines..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All Campus</option>
                    <option value="Student">Students Only</option>
                    <option value="Faculty">Faculty Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handlePublishNotice}
                disabled={publishing || !title.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {publishing ? 'Broadcasting...' : 'Broadcast Circular'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
