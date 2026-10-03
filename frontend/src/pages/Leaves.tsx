import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  PlaneTakeoff, PlusCircle, CheckCircle2, XCircle, 
  Clock, AlertCircle, X, User, MessageSquare 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LeavesPage: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Leave Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [applying, setApplying] = useState(false);

  // Review Modal
  const [reviewingLeave, setReviewingLeave] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewerRemarks, setReviewerRemarks] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, [user]);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!fromDate || !toDate || !reason.trim()) return;
    setApplying(true);
    try {
      await api.post('/leaves', {
        from_date: fromDate,
        to_date: toDate,
        reason: reason
      });
      confetti({ particleCount: 50, spread: 60 });
      setShowApplyModal(false);
      setReason('');
      loadLeaves();
    } catch (err) {
      alert('Failed to submit leave request');
    } finally {
      setApplying(false);
    }
  };

  const handleReviewLeave = async () => {
    if (!reviewingLeave) return;
    setSavingReview(true);
    try {
      await api.post(`/leaves/${reviewingLeave.id}/review`, {
        status: reviewStatus,
        reviewer_remarks: reviewerRemarks
      });
      confetti({ particleCount: 50, spread: 50 });
      setReviewingLeave(null);
      loadLeaves();
    } catch (err) {
      alert('Failed to review leave request');
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PlaneTakeoff className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Leave Management System</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Student academic leave applications, medical approvals & attendance dispensation workflow
          </p>
        </div>

        {user?.role === 'student' && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {/* Leaves Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaves.map((l) => (
          <div
            key={l.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {l.from_date} → {l.to_date}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  l.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                  l.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {l.status}
                </span>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-semibold">{l.student_name} ({l.student_roll})</p>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{l.reason}</h4>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Duration: <strong>{l.days_count} {l.days_count === 1 ? 'Day' : 'Days'}</strong></span>
                <span className="text-[10px] text-slate-400">
                  Applied: {new Date(l.created_at).toLocaleDateString()}
                </span>
              </div>

              {l.reviewer_remarks && (
                <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-700 border border-slate-200/60">
                  <span className="font-bold text-slate-900 block text-[10px] uppercase">
                    Reviewer Remarks ({l.reviewer_name || 'HOD/Faculty'}):
                  </span>
                  "{l.reviewer_remarks}"
                </div>
              )}

              {/* Action for Faculty/HOD/Admin */}
              {user?.role !== 'student' && l.status === 'Pending' && (
                <button
                  onClick={() => {
                    setReviewingLeave(l);
                    setReviewStatus('Approved');
                    setReviewerRemarks('Permission granted for college representation/medical recovery.');
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Review Application
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Submit Student Leave Application</h3>
              <button onClick={() => setShowApplyModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Leave</label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the academic purpose, competition, medical reason..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowApplyModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleApplyLeave}
                disabled={applying || !reason.trim() || !fromDate || !toDate}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Leave Modal */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Review Leave Request</h3>
              <button onClick={() => setReviewingLeave(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-900">{reviewingLeave.student_name} ({reviewingLeave.student_roll})</p>
                <p className="text-slate-600 font-mono">{reviewingLeave.from_date} to {reviewingLeave.to_date}</p>
                <p className="text-slate-700 italic mt-1">"{reviewingLeave.reason}"</p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Approved')}
                    className={`py-2 rounded-xl font-bold text-xs ${
                      reviewStatus === 'Approved' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Rejected')}
                    className={`py-2 rounded-xl font-bold text-xs ${
                      reviewStatus === 'Rejected' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reviewer Remarks</label>
                <input
                  type="text"
                  value={reviewerRemarks}
                  onChange={(e) => setReviewerRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setReviewingLeave(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleReviewLeave}
                disabled={savingReview}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {savingReview ? 'Saving...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
