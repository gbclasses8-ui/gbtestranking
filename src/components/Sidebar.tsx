import React from 'react';
import { GB_LOGO_URL, GB_TELEGRAM_URL } from '../services/api.ts';
import { Send, Layers } from 'lucide-react';

interface SidebarProps {
  batches: string[];
  selectedBatch: string | null;
  onSelectBatch: (b: string) => void;
  getBatchCount: (b: string) => number;
  totalTests: number;
  completedCount: number;
  loading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  batches,
  selectedBatch,
  onSelectBatch,
  getBatchCount,
  totalTests,
  completedCount,
  loading
}) => {
  return (
    <aside className="hidden md:flex flex-col w-[280px] border-r border-[var(--border)] bg-[var(--card)] shrink-0 h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[var(--border)]">
        <img
          src={GB_LOGO_URL}
          alt="GB STUDY"
          className="w-9 h-9 rounded-xl object-contain border border-[var(--border)] shadow-sm bg-white p-0.5"
        />
        <div>
          <h1 className="text-[15px] font-black tracking-tight uppercase leading-none">
            GB <span className="text-blue-500 font-semibold">STUDY</span>
          </h1>
          <p className="text-[9px] font-bold text-emerald-500 tracking-[0.15em] uppercase mt-1">
            🔒 10x Encrypted Vault
          </p>
        </div>
      </div>

      {/* Telegram Banner */}
      <div className="px-3.5 pt-3">
        <a
          href={GB_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-transparent border border-blue-500/30 hover:border-blue-500 transition-all text-xs group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Send className="w-3 h-3" />
            </div>
            <div>
              <div className="font-extrabold text-[11px] text-[var(--text)] leading-tight">
                Join Telegram
              </div>
              <div className="text-[9px] text-blue-500 font-bold">@GBFreestudy</div>
            </div>
          </div>
          <span className="text-[10px] text-blue-500 font-bold group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </a>
      </div>

      {/* Batches Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3.5 custom-scrollbar">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <p className="text-[10px] font-bold text-[var(--muted)] tracking-widest uppercase flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            <span>Exam Batches ({batches.length})</span>
          </p>
        </div>

        {loading ? (
          <div className="space-y-2 px-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-11 rounded-xl bg-zinc-200/60 dark:bg-zinc-900 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <nav className="space-y-1">
            {batches.map((batch) => {
              const count = getBatchCount(batch);
              const isSelected = selectedBatch === batch;
              return (
                <button
                  key={batch}
                  onClick={() => onSelectBatch(batch)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate pr-2">{batch}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--bg)] text-[var(--muted)] border border-[var(--border)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* User Progress Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/20">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="text-[var(--text)]">Your Progress</span>
            <span className="text-blue-500 font-extrabold">
              {completedCount} / {totalTests || 0}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{
                width: `${totalTests ? Math.min(100, (completedCount / totalTests) * 100) : 0}%`
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
