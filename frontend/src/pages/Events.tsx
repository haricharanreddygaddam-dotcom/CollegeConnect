import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  CalendarDays, MapPin, Users, PlusCircle, 
  CheckCircle2, Sparkles, X, Trophy, Code, Rocket 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New event modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [category, setCategory] = useState('Technical');
  const [maxParticipants, setMaxParticipants] = useState(200);
  const [organizer, setOrganizer] = useState('CampusConnect Student Council');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegister = async (eventId: number) => {
    try {
      const res = await api.post(`/events/${eventId}/register`);
      if (res.data.registered) {
        confetti({ particleCount: 70, spread: 60 });
      }
      loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register');
    }
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !eventDate || !venue.trim()) return;
    setCreating(true);
    try {
      await api.post('/events', {
        title,
        description,
        event_date: new Date(eventDate).toISOString(),
        venue,
        category,
        max_participants: maxParticipants,
        organizer
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      loadEvents();
    } catch (err) {
      alert('Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Campus Events & Activities</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Technical symposiums, hackathons, guest keynotes, workshops & sports leagues
          </p>
        </div>

        {user?.role !== 'student' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create College Event</span>
          </button>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((ev) => {
          const isRegistered = ev.is_registered;

          return (
            <div
              key={ev.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Event Header Banner */}
              <div className="h-32 bg-gradient-to-tr from-indigo-900 via-indigo-700 to-purple-800 p-5 text-white flex flex-col justify-between relative">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/20">
                    {ev.category}
                  </span>
                  <span className="text-xs font-mono font-bold bg-black/30 px-2 py-0.5 rounded-md">
                    {new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-base font-bold leading-tight drop-shadow-sm text-white">{ev.title}</h3>
              </div>

              {/* Event Details */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{ev.description}</p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-700">{ev.venue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{ev.registered_count}</strong> / {ev.max_participants} registered
                    </span>
                    <span className="text-[11px] text-slate-400">{ev.organizer}</span>
                  </div>
                </div>

                {/* RSVP action */}
                <div className="pt-2">
                  <button
                    onClick={() => handleToggleRegister(ev.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isRegistered
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100'
                    }`}
                  >
                    {isRegistered ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Registered (Click to Cancel)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>RSVP / Register Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Organize New Campus Event</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI DevFest & Hackathon 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Agenda</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details on competitions, keynotes, prizes..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date & Time</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Venue / Room</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Block A Main Auditorium"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={creating || !title.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {creating ? 'Scheduling...' : 'Schedule Event'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
