import React from 'react';
import { TestItem } from '../types/index.ts';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TestCardProps {
  test: TestItem;
  viewMode: 'grid' | 'list';
  attemptedData?: { score: number; maxScore: number; date?: string };
  onStartTest: (test: TestItem) => void;
}

export const TestCard: React.FC<TestCardProps> = ({
  test,
  viewMode,
  attemptedData,
  onStartTest
}) => {
  const isAttempted = !!attemptedData;

  if (viewMode === 'list') {
    return (
      <div className="group bg-[var(--card)] border border-[var(--border)] hover:border-blue-500/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {test.package_name}
            </span>
            {test.smart_category && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {test.smart_category}
              </span>
            )}
            <span className="text-[10px] text-[var(--muted)] font-mono">
              ID: #{test.id}
            </span>
          </div>

          <h3 className="font-bold text-sm sm:text-base leading-snug text-[var(--text)] group-hover:text-blue-500 transition-colors">
            {test.test_name}
          </h3>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--muted)] mt-2">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Encrypted CBT</span>
            </span>
            <span>•</span>
            <span>EN / HI</span>
            {isAttempted && (
              <>
                <span>•</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Score: {attemptedData.score.toFixed(1)}</span>
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => onStartTest(test)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all shrink-0 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
            isAttempted
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
          }`}
        >
          <span>{isAttempted ? 'Re-Attempt' : 'Start Test'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group bg-[var(--card)] border border-[var(--border)] hover:border-blue-500/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {test.package_name}
            </span>
            {test.smart_category && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {test.smart_category}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[var(--muted)] font-mono">
            #{test.id}
          </span>
        </div>

        <h3 className="font-bold text-sm sm:text-base leading-snug group-hover:text-blue-500 transition-colors line-clamp-2 text-[var(--text)]">
          {test.test_name}
        </h3>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Encrypted CBT</span>
          </span>
          <span>•</span>
          <span>EN / HI</span>
        </div>

        <button
          onClick={() => onStartTest(test)}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shrink-0 shadow-sm flex items-center gap-1 cursor-pointer ${
            isAttempted
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
          }`}
        >
          <span>{isAttempted ? 'Re-Attempt' : 'Start Test'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
