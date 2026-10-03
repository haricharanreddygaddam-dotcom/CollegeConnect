import React, { useState } from 'react';
import { QrCode, Camera, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import api from '../api/client';
import confetti from 'canvas-confetti';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suggestedToken?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  suggestedToken = ''
}) => {
  const [tokenInput, setTokenInput] = useState(suggestedToken);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; subject?: string } | null>(null);

  if (!isOpen) return null;

  const handleScanSubmit = async (tokenToUse?: string) => {
    const finalToken = tokenToUse || tokenInput;
    if (!finalToken.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/attendance/scan-qr', { qr_token: finalToken.trim() });
      setResult({
        success: true,
        message: res.data.message,
        subject: res.data.subject
      });
      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.response?.data?.detail || 'Invalid or expired QR Attendance token'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden animate-slide-up">
        
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Scan QR Attendance</h3>
              <p className="text-xs text-slate-500">Fast geo-verified digital check-in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder animation */}
        <div className="mt-5 relative aspect-square max-w-[240px] mx-auto rounded-2xl bg-slate-950 flex flex-col items-center justify-center overflow-hidden border-2 border-indigo-500 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          {/* Animated laser scanline */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-[bounce_2.5s_infinite]" />

          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br" />

          <Camera className="w-10 h-10 text-slate-600 animate-pulse-subtle" />
          <span className="text-[11px] text-slate-400 font-medium mt-2">Simulated Camera Active</span>
        </div>

        {/* Status result alert */}
        {result && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
            result.success 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{result.success ? 'Attendance Recorded!' : 'Check-in Failed'}</p>
              <p className="mt-0.5">{result.message}</p>
            </div>
          </div>
        )}

        {/* Input & Simulated check-in */}
        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              QR Code Token / Passphrase
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. WT_2026_SESSION_ACTIVE"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleScanSubmit()}
              disabled={loading || !tokenInput}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200"
            >
              {loading ? 'Verifying...' : 'Submit Attendance'}
            </button>

            <button
              onClick={() => {
                setTokenInput('TEST_WT_ACTIVE_KEY');
                handleScanSubmit('TEST_WT_ACTIVE_KEY');
              }}
              title="1-Click Auto Scan Simulation"
              className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs py-2.5 rounded-xl border border-indigo-200 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Scan</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
