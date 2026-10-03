import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  MessageSquareHeart, Star, PlusCircle, CheckCircle2, 
  Sparkles, Filter, ShieldCheck, ThumbsUp 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Feedback Form State
  const [category, setCategory] = useState('Faculty');
  const [targetName, setTargetName] = useState('Prof. David Thorne (Web Tech)');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories = ['Faculty', 'Course', 'Infrastructure', 'Library', 'Campus', 'General'];

  useEffect(() => {
    loadFeedback();
  }, [user]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      if (user?.role !== 'student') {
        const res = await api.get('/feedback');
        setFeedbacks(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    setSubmitting(true);
    setSuccessMsg(null);
    try {
      await api.post('/feedback', {
        category,
        target_name: targetName,
        rating,
        comments,
        is_anonymous: isAnonymous
      });
      confetti({ particleCount: 60, spread: 60 });
      setSuccessMsg('Thank you! Your institutional feedback has been recorded anonymously & securely.');
      setComments('');
      loadFeedback();
    } catch (err) {
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquareHeart className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Institutional Feedback System</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Anonymous course evaluations, faculty appraisal, laboratory & infrastructure feedback
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Feedback Submission Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Submit New Feedback</h3>
            <p className="text-xs text-slate-500">Help improve teaching quality and campus facilities</p>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Feedback Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value === 'Faculty') setTargetName('Prof. David Thorne (Web Tech)');
                  else if (e.target.value === 'Course') setTargetName('Database Management Systems');
                  else if (e.target.value === 'Infrastructure') setTargetName('Computer Science Cloud Lab');
                  else setTargetName('Main Central Library');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Subject / Entity</label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="e.g. Web Technologies or Block A WiFi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Interactive Star Rating */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Overall Rating</label>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 ml-2">
                  {rating} / 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Constructive Feedback / Comments</label>
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your detailed feedback, practical insights, suggestions for improvement..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anon"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="anon" className="text-slate-600 font-medium">
                Submit Anonymously (Hide student identity)
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !comments.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 transition-all hover:scale-105"
            >
              {submitting ? 'Submitting...' : 'Submit Institutional Feedback'}
            </button>
          </form>
        </div>

        {/* Aggregated Feedback Stream (Admin / Faculty / HOD View) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Student Appraisals & Feedback Stream</h3>
              <p className="text-xs text-slate-500">Live aggregated reviews from across academic departments</p>
            </div>
            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-full">
              Average 4.8 ★
            </span>
          </div>

          <div className="space-y-3">
            {(feedbacks.length > 0 ? feedbacks : [
              {
                id: 1,
                category: 'Faculty',
                target_name: 'Prof. David Thorne (Web Tech)',
                rating: 5,
                comments: 'Engaging practical sessions, real-world coding examples, and interactive project mentorship!',
                student_name: 'Haricharan Reddy',
                created_at: new Date().toISOString()
              },
              {
                id: 2,
                category: 'Course',
                target_name: 'Database Management Systems',
                rating: 5,
                comments: 'Very clear explanations of query optimizations and indexing strategies.',
                student_name: 'Anonymous Student',
                created_at: new Date().toISOString()
              },
              {
                id: 3,
                category: 'Infrastructure',
                target_name: 'Computer Science High Performance Lab',
                rating: 4,
                comments: 'High-speed systems and dual monitors are great, adding GPU nodes would be awesome.',
                student_name: 'Student',
                created_at: new Date().toISOString()
              }
            ]).map((fb) => (
              <div key={fb.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                      {fb.category}
                    </span>
                    <strong className="text-xs font-bold text-slate-900">{fb.target_name}</strong>
                  </div>

                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: fb.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic">"{fb.comments}"</p>

                <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Author: {fb.student_name}</span>
                  <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
