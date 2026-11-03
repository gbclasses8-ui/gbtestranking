import React from 'react';
import { GB_LOGO_URL, GB_TELEGRAM_URL, FOUNDER_NAME } from '../services/api.ts';
import { Send, RotateCcw, X, ShieldCheck } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
  onResetHistory: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  completedCount,
  onResetHistory
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] border border-[var(--border)] rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative w-20 h-20 mx-auto mb-3">
          <img
            src={GB_LOGO_URL}
            alt={FOUNDER_NAME}
            className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-blue-500 shadow-lg p-1 bg-white"
          />
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <h3 className="text-lg font-black text-[var(--text)] tracking-tight">
          {FOUNDER_NAME}
        </h3>
        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-0.5">
          Founder • GB STUDY
        </p>

        <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">
          Protected by GB STUDY Vault Dynamic Cipher & Anti-Replay Edge Security.
        </p>

        <a
          href={GB_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Join Telegram (@GBFreestudy)</span>
        </a>

        <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
          <span>
            Tests Completed: <b className="text-[var(--text)] font-extrabold">{completedCount}</b>
          </span>
          <button
            onClick={onResetHistory}
            className="text-red-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
