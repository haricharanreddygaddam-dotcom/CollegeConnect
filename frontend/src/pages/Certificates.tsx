import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  FileCheck2, PlusCircle, CheckCircle2, QrCode, 
  Eye, Printer, ShieldCheck, X, Sparkles, ExternalLink 
} from 'lucide-react';
import { CertificateViewerModal } from '../components/CertificateViewerModal';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [certType, setCertType] = useState('Bonafide Certificate');
  const [purpose, setPurpose] = useState('');
  const [requesting, setRequesting] = useState(false);

  // Certificate Viewer Modal
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  // Admin Review
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const certTypes = [
    'Bonafide Certificate',
    'Study Certificate',
    'Transfer Certificate',
    'Course Completion Certificate',
    'Character Certificate'
  ];

  useEffect(() => {
    loadCertificates();
  }, [user]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/certificates');
      setCerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCertificate = async () => {
    if (!purpose.trim()) return;
    setRequesting(true);
    try {
      await api.post('/certificates', {
        cert_type: certType,
        purpose: purpose
      });
      confetti({ particleCount: 50, spread: 60 });
      setShowRequestModal(false);
      setPurpose('');
      loadCertificates();
    } catch (err) {
      alert('Failed to submit certificate request');
    } finally {
      setRequesting(false);
    }
  };

  const handleApproveCertificate = async (id: number) => {
    setReviewingId(id);
    try {
      await api.post(`/certificates/${id}/review`, { status: 'Approved' });
      confetti({ particleCount: 80, spread: 70 });
      loadCertificates();
    } catch (err) {
      alert('Failed to approve certificate');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Certificate Issuance & QR Verification</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-proof digital credentials with cryptographically signed QR verification codes
          </p>
        </div>

        {user?.role === 'student' && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request Certificate</span>
          </button>
        )}
      </div>

      {/* Certificates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certs.map((c) => {
          const isApproved = c.status === 'Approved';

          return (
            <div
              key={c.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                    {c.cert_type}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">{c.student_name} ({c.student_roll})</p>
                  <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug">Purpose: {c.purpose}</h4>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                {isApproved && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Certificate ID:</span>
                      <strong className="font-mono text-indigo-900">{c.certificate_number}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Issued Date:</span>
                      <span className="font-mono text-slate-700">{c.issued_date}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isApproved ? (
                    <>
                      <button
                        onClick={() => setSelectedCert(c)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View & Print</span>
                      </button>

                      <Link
                        to={`/verify/${c.verification_hash || 'cc89f2a41d01'}`}
                        target="_blank"
                        className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
                        title="Open Public QR Verification Portal"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </Link>
                    </>
                  ) : (
                    user?.role !== 'student' ? (
                      <button
                        onClick={() => handleApproveCertificate(c.id)}
                        disabled={reviewingId === c.id}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{reviewingId === c.id ? 'Generating QR...' : 'Approve & Issue Certificate'}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2 text-center text-xs text-amber-700 bg-amber-50 rounded-xl font-medium">
                        Verification in progress by Registrar
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Request Certificate Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Request Official Certificate</h3>
              <button onClick={() => setShowRequestModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Certificate Type</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {certTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose / Recipient Authority</label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Internship Application at Google / Passport & Visa Verification / Education Loan"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowRequestModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleRequestCertificate}
                disabled={requesting || !purpose.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {requesting ? 'Processing...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      <CertificateViewerModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        cert={selectedCert}
      />

    </div>
  );
};
