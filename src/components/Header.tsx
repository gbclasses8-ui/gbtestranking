import React from 'react';
import { GB_LOGO_URL, GB_TELEGRAM_URL, FOUNDER_NAME } from '../services/api.ts';
import { Search, X, LayoutGrid, List, Sun, Moon, Send } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (m: 'grid' | 'list') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isDark,
  onToggleTheme,
  onOpenProfile
}) => {
  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 z-20 shrink-0 sticky top-0 gap-2.5 sm:gap-4">
      {/* Mobile Branding */}
      <div className="md:hidden flex items-center gap-2 shrink-0">
        <img
          src={GB_LOGO_URL}
          alt="GB STUDY"
          className="w-8 h-8 rounded-lg object-contain border border-[var(--border)] bg-white p-0.5"
        />
        <div>
          <h1 className="text-sm font-black tracking-tight uppercase leading-none">
            GB<span className="text-blue-500">STUDY</span>
          </h1>
          <span className="text-[8px] font-bold text-emerald-500 tracking-[0.12em] uppercase block mt-0.5">
            🔒 Vault Protected
          </span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search any mock test or ID across batches..."
          className="w-full pl-9 pr-8 py-2 bg-[var(--bg)] border border-[var(--border)] focus:border-blue-500 rounded-xl text-xs sm:text-sm outline-none transition-all placeholder:text-[var(--muted)]"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--text)] px-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Grid / List switch */}
        <div className="hidden sm:flex items-center bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)]">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            title="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Telegram Direct Button */}
        <a
          href={GB_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
          title="Join Official Telegram"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Telegram</span>
        </a>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center active:scale-95 transition-all hover:border-blue-500 cursor-pointer"
          title="Toggle Dark / Light Mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Profile Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1 pr-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 active:scale-95 transition-all cursor-pointer"
          title="Candidate Profile"
        >
          <img
            src={GB_LOGO_URL}
            alt={FOUNDER_NAME}
            className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-zinc-200"
          />
          <span className="hidden sm:inline text-xs font-bold text-[var(--text)]">
            {FOUNDER_NAME}
          </span>
        </button>
      </div>
    </header>
  );
};
