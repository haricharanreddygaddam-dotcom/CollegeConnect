import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Calendar, Clock, MapPin, User, Sparkles, BookOpen } from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    loadTimetable();
  }, [user]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.get('/timetable');
      setTimetable(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const daySlots = timetable.filter((t) => t.day_of_week === activeDay);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Academic Timetable & Schedule</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of CSE • B.Tech 3rd Year • Semester 5 (Section A)
          </p>
        </div>

        {/* Day Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDay === day
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream for Active Day */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">{activeDay}'s Chronological Lectures</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{daySlots.length} Scheduled Sessions</span>
        </div>

        <div className="space-y-4">
          {daySlots.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No classes scheduled for {activeDay}
            </div>
          ) : (
            daySlots.map((slot, index) => (
              <div 
                key={slot.id || index}
                className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 hover:to-indigo-50/70 border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-mono font-bold text-xs shrink-0 text-center shadow-md shadow-indigo-100">
                    <Clock className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    <span>{slot.start_time}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                        {slot.subject_code}
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-medium">to {slot.end_time}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{slot.subject_name}</h4>
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{slot.faculty_name || 'Assigned Instructor'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{slot.room_number}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Complete Weekly Grid Matrix */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Full Weekly Timetable Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                <th className="p-3">Day</th>
                <th className="p-3">09:00 - 10:00</th>
                <th className="p-3">10:00 - 11:00</th>
                <th className="p-3">11:15 - 12:15</th>
                <th className="p-3">01:15 - 02:15</th>
                <th className="p-3">02:15 - 03:15</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daysOfWeek.map((d) => {
                const slots = timetable.filter((t) => t.day_of_week === d);
                return (
                  <tr key={d} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900 bg-slate-50/50">{d}</td>
                    {slots.slice(0, 5).map((s, idx) => (
                      <td key={idx} className="p-3">
                        <div className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-0.5">
                          <p className="font-bold text-indigo-900 text-[11px] truncate max-w-[130px]">{s.subject_code}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{s.room_number}</p>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
