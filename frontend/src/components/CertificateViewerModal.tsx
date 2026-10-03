import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

interface CertificateData {
  id: number;
  student_name: string;
  student_roll: string;
  department_name: string;
  admission_year?: number;
  cgpa?: number;
  cert_type: string;
  purpose: string;
  certificate_number: string;
  verification_hash: string;
  qr_code_url?: string;
  issued_date: string;
}

interface CertificateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cert: CertificateData | null;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  isOpen,
  onClose,
  cert
}) => {
  if (!isOpen || !cert) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-slide-up my-8">
        
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900 text-sm">Official University Certificate Document</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div 
          id="printable-certificate"
          className="mt-4 p-8 sm:p-10 rounded-2xl border-8 border-double border-indigo-900 bg-gradient-to-b from-amber-50/20 via-white to-amber-50/10 shadow-inner relative text-slate-800"
        >
          {/* Subtle watermark background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <div className="text-8xl font-black text-indigo-950 uppercase tracking-widest">
              CAMPUS CONNECT
            </div>
          </div>

          {/* Certificate Header */}
          <div className="text-center space-y-1 relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-900 text-amber-300 flex items-center justify-center font-serif text-2xl font-bold border-4 border-amber-300 shadow-md">
              CC
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-indigo-950 tracking-wide uppercase mt-2">
              CampusConnect Institute of Technology
            </h2>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              Autonomous Institution • Approved by UGC & AICTE
            </p>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto my-3" />
            <h3 className="text-lg font-bold uppercase tracking-wider text-amber-700 font-serif">
              {cert.cert_type}
            </h3>
          </div>

          {/* Certificate Body */}
          <div className="mt-8 text-sm leading-relaxed text-slate-700 text-center space-y-4 font-serif">
            <p>
              This is to certify that Mr./Ms.{' '}
              <strong className="text-indigo-950 text-base font-sans underline decoration-amber-400 decoration-2 font-bold px-1">
                {cert.student_name}
              </strong>
              , bearing Roll Number{' '}
              <strong className="text-indigo-950 font-sans font-bold">
                {cert.student_roll}
              </strong>
              , is a bonafide student of this institution pursuing{' '}
              <strong className="text-indigo-950 font-semibold font-sans">
                Bachelor of Technology in {cert.department_name}
              </strong>
              {cert.admission_year ? ` (Academic Year ${cert.admission_year}–${cert.admission_year + 4})` : ''}.
            </p>

            <p className="text-xs text-slate-600 italic">
              This document is issued upon request for the purpose of:{' '}
              <span className="font-medium text-slate-800 not-italic font-sans font-semibold">"{cert.purpose}"</span>.
            </p>

            <p className="text-xs text-slate-600">
              During the period of study, their academic conduct and character have been found to be{' '}
              <strong className="text-slate-900 font-semibold">Exemplary</strong>.
            </p>
          </div>

          {/* Certificate Footer with QR Code & Signatures */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-end justify-between gap-6 relative">
            
            {/* QR Verification Badge */}
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 bg-white p-1 rounded-lg border-2 border-slate-300 shadow-sm flex items-center justify-center">
                {cert.qr_code_url ? (
                  <img src={cert.qr_code_url} alt="QR Auth" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-[9px] text-slate-400">
                    <QrCode className="w-6 h-6 text-indigo-700" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
              <div className="text-left text-[11px] space-y-0.5 font-sans">
                <p className="font-bold text-indigo-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> Digital Authentic
                </p>
                <p className="text-slate-500 font-mono text-[10px]">No: {cert.certificate_number}</p>
                <p className="text-slate-500 font-mono text-[10px]">Hash: {cert.verification_hash}</p>
                <p className="text-slate-500 text-[10px]">Date: {cert.issued_date}</p>
              </div>
            </div>

            {/* Official Seal and Signatures */}
            <div className="text-center font-sans space-y-1">
              <div className="w-28 border-b-2 border-slate-700 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900">Dr. Arthur Pendelton</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Registrar & Controller of Examinations
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
