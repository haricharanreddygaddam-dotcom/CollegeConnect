import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  FileText, UploadCloud, CheckCircle2, Clock, 
  PlusCircle, Award, MessageSquare, AlertCircle, X, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Student submission modal
  const [submittingAssign, setSubmittingAssign] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Faculty create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newMaxMarks, setNewMaxMarks] = useState(20.0);
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Faculty submissions grading modal
  const [viewingSubmissionsAssign, setViewingSubmissionsAssign] = useState<any | null>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [gradingSub, setGradingSub] = useState<any | null>(null);
  const [marksAwarded, setMarksAwarded] = useState<number>(18.0);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data);

      const subjRes = await api.get('/subjects');
      setSubjects(subjRes.data);
      if (subjRes.data.length > 0) setNewSubjectId(subjRes.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async () => {
    if (!submittingAssign) return;
    setSubmitting(true);
    try {
      await api.post('/assignments/submit', {
        assignment_id: submittingAssign.id,
        submission_text: submissionText,
        file_url: fileUrl || 'https://github.com/campusconnect/submission-artifacts'
      });
      confetti({ particleCount: 70, spread: 60 });
      setSubmittingAssign(null);
      setSubmissionText('');
      loadAssignments();
    } catch (err) {
      alert('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!newSubjectId || !newTitle.trim() || !newDueDate) return;
    setCreating(true);
    try {
      await api.post('/assignments', {
        subject_id: newSubjectId,
        title: newTitle,
        description: newDesc,
        max_marks: newMaxMarks,
        due_date: new Date(newDueDate).toISOString()
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      loadAssignments();
    } catch (err) {
      alert('Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const openSubmissionsView = async (assign: any) => {
    setViewingSubmissionsAssign(assign);
    try {
      const res = await api.get(`/assignments/${assign.id}/submissions`);
      setSubmissionsList(res.data);
    } catch (err) {}
  };

  const handleGradeSubmission = async () => {
    if (!gradingSub) return;
    setSavingGrade(true);
    try {
      await api.post(`/assignments/submissions/${gradingSub.id}/grade`, {
        marks_awarded: marksAwarded,
        feedback: gradingFeedback
      });
      confetti({ particleCount: 50, spread: 50 });
      setGradingSub(null);
      if (viewingSubmissionsAssign) {
        openSubmissionsView(viewingSubmissionsAssign);
      }
      loadAssignments();
    } catch (err) {
      alert('Failed to grade submission');
    } finally {
      setSavingGrade(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return !a.my_submission || a.my_submission.status === 'Pending';
    if (filter === 'Submitted') return a.my_submission?.status === 'Submitted';
    if (filter === 'Evaluated') return a.my_submission?.status === 'Evaluated';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Assignment Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Coursework deliverables, submissions tracking, rubrics & automated grading
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role !== 'student' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Assignment</span>
            </button>
          )}

          {user?.role === 'student' && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              {['All', 'Pending', 'Submitted', 'Evaluated'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((a) => {
          const isSubmitted = !!a.my_submission;
          const isEvaluated = a.my_submission?.status === 'Evaluated';

          return (
            <div
              key={a.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                    {a.subject_name}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Max: {a.max_marks} M
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">{a.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{a.description}</p>
              </div>

              {/* Status or Submission info */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </span>

                  {user?.role === 'student' ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isEvaluated ? 'bg-emerald-100 text-emerald-800' :
                      isSubmitted ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {isEvaluated ? `Scored: ${a.my_submission.marks_awarded}/${a.max_marks}` : isSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                  ) : (
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      {a.submissions_count || 0} Submissions
                    </span>
                  )}
                </div>

                {/* Feedback note if evaluated */}
                {isEvaluated && a.my_submission?.feedback && (
                  <div className="p-2.5 bg-emerald-50/70 rounded-xl text-[11px] text-emerald-800 border border-emerald-100">
                    <strong className="block text-[10px] uppercase tracking-wider text-emerald-900">Faculty Feedback:</strong>
                    "{a.my_submission.feedback}"
                  </div>
                )}

                {/* Action button */}
                {user?.role === 'student' ? (
                  <button
                    onClick={() => {
                      setSubmittingAssign(a);
                      setSubmissionText(a.my_submission?.submission_text || '');
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSubmitted
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isSubmitted ? 'Update Submission' : 'Submit Assignment'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openSubmissionsView(a)}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>View & Grade Submissions</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Submission Modal */}
      {submittingAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Submit Assignment Response</h3>
                <p className="text-xs text-slate-500">{submittingAssign.title}</p>
              </div>
              <button
                onClick={() => setSubmittingAssign(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Submission Summary / GitHub Link / Notes
                </label>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste repository links, implementation highlights, or summary of deliverables..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Project Attachment / Cloud Link (Optional)
                </label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://github.com/my-user/fastapi-rest-service"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSubmittingAssign(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleStudentSubmit}
                disabled={submitting || !submissionText.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {submitting ? 'Uploading...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Publish New Course Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                <select
                  value={newSubjectId || ''}
                  onChange={(e) => setNewSubjectId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Docker Containerization & Microservice Deployment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Instructions & Problem Statement</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe requirements, deliverables, and rubric criteria..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={creating || !newTitle.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {creating ? 'Publishing...' : 'Publish Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Submissions Table & Grading Modal */}
      {viewingSubmissionsAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 relative animate-slide-up space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Submissions Roster</h3>
                <p className="text-xs text-slate-500">{viewingSubmissionsAssign.title}</p>
              </div>
              <button onClick={() => setViewingSubmissionsAssign(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Submitted At</th>
                    <th className="pb-3">Submission Notes</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissionsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No submissions uploaded yet.</td>
                    </tr>
                  ) : (
                    submissionsList.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{sub.student_name} ({sub.student_roll})</td>
                        <td className="py-3 font-mono text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                        <td className="py-3 text-slate-600 max-w-xs truncate">{sub.submission_text || '—'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'Evaluated' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {sub.status === 'Evaluated' ? `${sub.marks_awarded}/${sub.max_marks} M` : sub.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setGradingSub(sub);
                              setMarksAwarded(sub.marks_awarded || 18.0);
                              setGradingFeedback(sub.feedback || '');
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs"
                          >
                            Grade
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* In-modal grading subview */}
            {gradingSub && (
              <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <h4 className="font-bold text-indigo-950 text-xs">
                  Grading: {gradingSub.student_name}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Marks (Max {gradingSub.max_marks})</label>
                    <input
                      type="number"
                      step="0.5"
                      max={gradingSub.max_marks}
                      value={marksAwarded}
                      onChange={(e) => setMarksAwarded(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Feedback</label>
                    <input
                      type="text"
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      placeholder="e.g. Outstanding implementation and thorough unit tests"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setGradingSub(null)} className="px-3 py-1 text-xs text-slate-500">Cancel</button>
                  <button
                    onClick={handleGradeSubmission}
                    disabled={savingGrade}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {savingGrade ? 'Saving...' : 'Save Grade'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
