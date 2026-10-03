import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ShieldCheck, XCircle, CheckCircle2, QrCode, ArrowLeft, Building2, User } from 'lucide-react';

export const VerifyCertificatePage: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hash) {
      api.get(`/certificates/verify/${hash}`)
        .then((res) => setData(res.data))
        .catch(() => setData({ valid: false, message: 'Invalid or expired verification hash' }))
        .finally(() => setLoading(false));
    }
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Verifying Digital Seal with University Database...</p>
        </div>
      </div>
    );
  }

  const isValid = data && data.valid;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-6">
        
        {/* Verification Status Header */}
        <div className="text-center space-y-3">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            isValid ? 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50' : 'bg-rose-100 text-rose-600 ring-8 ring-rose-50'
          }`}>
            {isValid ? <ShieldCheck className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {isValid ? 'Official Record Verified ✓' : 'Invalid Document'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {isValid ? 'Authentic University Credential' : 'Verification Unsuccessful'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {data.message}
            </p>
          </div>
        </div>

        {/* Verified Certificate Metadata */}
        {isValid && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Student Name</span>
                <strong className="text-slate-900 text-sm font-bold">{data.student_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Roll Number</span>
                <strong className="text-indigo-900 font-mono text-sm font-bold">{data.roll_number}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Certificate Type</span>
                <span className="text-slate-800 font-bold">{data.certificate_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Certificate Serial</span>
                <span className="text-slate-800 font-mono font-bold">{data.certificate_number}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Department</span>
                <span className="text-slate-800">{data.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Issued Date</span>
                <span className="text-slate-800 font-mono">{data.issued_date}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Issuing Body:</span>
              <strong className="text-slate-800">{data.institution}</strong>
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to CampusConnect Portal</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
