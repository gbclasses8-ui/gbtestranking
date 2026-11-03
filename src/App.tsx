/**
 * GB STUDY - Premium CBT Examination & Mock Test Platform
 * Batches, Mock Tests, DPP, and Solutions by SARVOTTAM
 * Official Telegram: https://t.me/GBFreestudy
 */
import React, { useState, useEffect, useMemo } from 'react';
import { TestItem } from './types/index.ts';
import { fetchAllTests, GB_LOGO_URL, GB_TELEGRAM_URL, FOUNDER_NAME } from './services/api.ts';
import { SplashScreen } from './components/SplashScreen.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TestCard } from './components/TestCard.tsx';
import { CBTExam } from './components/CBTExam.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { Send, ArrowLeft, BookOpen, Layers, CheckCircle2, RotateCcw } from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allTests, setAllTests] = useState<TestItem[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [attemptFilter, setAttemptFilter] = useState<'all' | 'unattempted' | 'attempted'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [testHistory, setTestHistory] = useState<Record<string, { score: number; maxScore: number; date: string }>>({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeExamTest, setActiveExamTest] = useState<TestItem | null>(null);

  // Initialize theme & test history & check splash
  useEffect(() => {
    if (!sessionStorage.getItem('gb_splash_seen')) {
      setShowSplash(true);
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    try {
      // Support both legacy spidy_test_history and gb_test_history
      const savedHist = localStorage.getItem('gb_test_history') || localStorage.getItem('spidy_test_history');
      if (savedHist) {
        setTestHistory(JSON.parse(savedHist));
      }
    } catch (e) {
      console.error('Failed to parse test history', e);
    }
  }, []);

  // Fetch tests from proxy
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const tests = await fetchAllTests();
        if (!mounted) return;
        setAllTests(tests);
        if (tests.length > 0 && window.innerWidth >= 768) {
          const firstBatch = Array.from(new Set(tests.map((t) => t.package_name))).sort()[0];
          setSelectedBatch(firstBatch);
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage(err.message || 'Encrypted connection failed');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Theme toggle
  const handleToggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Batches list
  const batches = useMemo(() => {
    return Array.from(new Set(allTests.map((t) => t.package_name))).sort();
  }, [allTests]);

  // Categories in selected batch
  const categories = useMemo(() => {
    if (!selectedBatch) return ['All'];
    const cats = Array.from(
      new Set(
        allTests
          .filter((t) => t.package_name === selectedBatch)
          .map((t) => t.smart_category || 'Practice Tests')
      )
    ).sort();
    return ['All', ...cats];
  }, [allTests, selectedBatch]);

  // Filtered tests
  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTests.filter((t) => {
      const matchSearch =
        !q ||
        t.test_name.toLowerCase().includes(q) ||
        String(t.id).toLowerCase().includes(q) ||
        t.package_name.toLowerCase().includes(q);

      const matchBatch = !!q || t.package_name === selectedBatch;
      const matchCat = !!q || selectedCategory === 'All' || t.smart_category === selectedCategory;

      const isAttempted = !!testHistory[String(t.id)];
      const matchAttempt =
        attemptFilter === 'all' ||
        (attemptFilter === 'attempted' ? isAttempted : !isAttempted);

      return matchSearch && matchBatch && matchCat && matchAttempt;
    });
  }, [allTests, selectedBatch, selectedCategory, searchQuery, attemptFilter, testHistory]);

  const completedCount = Object.keys(testHistory).length;

  const handleSaveResult = (testId: string | number, score: number, maxScore: number) => {
    const updated = {
      ...testHistory,
      [String(testId)]: {
        score,
        maxScore,
        date: new Date().toISOString()
      }
    };
    setTestHistory(updated);
    try {
      localStorage.setItem('gb_test_history', JSON.stringify(updated));
      localStorage.setItem('spidy_test_history', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleResetHistory = () => {
    if (window.confirm('Are you sure you want to reset all test attempts history?')) {
      localStorage.removeItem('gb_test_history');
      localStorage.removeItem('spidy_test_history');
      setTestHistory({});
      setIsProfileOpen(false);
    }
  };

  // If taking CBT Exam, render full CBT platform
  if (activeExamTest) {
    return (
      <CBTExam
        test={activeExamTest}
        onExit={() => setActiveExamTest(null)}
        onSaveResult={handleSaveResult}
      />
    );
  }

  return (
    <>
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            sessionStorage.setItem('gb_splash_seen', 'true');
            setShowSplash(false);
          }}
        />
      )}

      <div
        className={`flex h-[100dvh] bg-[var(--bg)] text-[var(--text)] overflow-hidden font-sans transition-opacity duration-500 ${
          showSplash ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Desktop Sidebar */}
        <Sidebar
          batches={batches}
          selectedBatch={selectedBatch}
          onSelectBatch={(b) => {
            setSearchQuery('');
            setSelectedBatch(b);
            setSelectedCategory('All');
          }}
          getBatchCount={(b) => allTests.filter((t) => t.package_name === b).length}
          totalTests={allTests.length}
          completedCount={completedCount}
          loading={loading}
        />

        {/* Main Content View */}
        <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg)] relative overflow-hidden">
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
            onOpenProfile={() => setIsProfileOpen(true)}
          />

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6">
            <div className="max-w-6xl mx-auto w-full space-y-5 sm:space-y-6">
              {/* Telegram Official Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg">
                      GB STUDY Official Channel
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      Join @GBFreestudy for daily DPP, free mock test PDFs, lecture links, and exam notes by {FOUNDER_NAME}.
                    </p>
                  </div>
                </div>

                <a
                  href={GB_TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-white text-blue-600 font-extrabold rounded-xl text-xs shadow-md hover:bg-blue-50 transition shrink-0 active:scale-95 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Join Telegram</span>
                </a>
              </div>

              {/* Top Stats Overview */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                      Total Tests
                    </p>
                    <p className="text-lg sm:text-2xl font-black mt-0.5 text-[var(--text)]">
                      {loading ? '...' : allTests.length}
                    </p>
                  </div>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm sm:text-base">
                    📚
                  </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                      Exam Batches
                    </p>
                    <p className="text-lg sm:text-2xl font-black mt-0.5 text-[var(--text)]">
                      {loading ? '...' : batches.length}
                    </p>
                  </div>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm sm:text-base">
                    🗂️
                  </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                      Completed
                    </p>
                    <p className="text-lg sm:text-2xl font-black text-emerald-500 mt-0.5">
                      {completedCount}
                    </p>
                  </div>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm sm:text-base">
                    ✅
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
                  <p className="text-sm font-bold text-red-500 mb-1">
                    Unable to Load Encrypted Vault
                  </p>
                  <p className="text-xs text-[var(--muted)] mb-4">{errorMessage}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 cursor-pointer"
                  >
                    Retry Handshake
                  </button>
                </div>
              )}

              {/* Mobile Exam Batch Selector (when no search query and no batch chosen) */}
              {!searchQuery.trim() && !selectedBatch && (
                <div className="md:hidden space-y-3">
                  <h2 className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest px-1">
                    Select Exam Batch
                  </h2>

                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-20 rounded-2xl bg-[var(--card)] border border-[var(--border)] animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {batches.map((b) => {
                        const count = allTests.filter((t) => t.package_name === b).length;
                        return (
                          <button
                            key={b}
                            onClick={() => {
                              setSelectedBatch(b);
                              setSelectedCategory('All');
                            }}
                            className="bg-[var(--card)] border border-[var(--border)] hover:border-blue-500 rounded-2xl p-4 flex items-center justify-between active:scale-[0.99] transition-all text-left shadow-sm cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                                📁
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-sm sm:text-base truncate text-[var(--text)]">
                                  {b}
                                </h3>
                                <p className="text-xs text-[var(--muted)] mt-0.5">
                                  {count} Mock Tests Available
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-blue-500 ml-2 shrink-0">
                              Open →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Active Batch View or Search Results */}
              {(selectedBatch || searchQuery.trim()) && (
                <div className="space-y-4">
                  {/* Title & Filter Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {!searchQuery.trim() && (
                        <button
                          onClick={() => setSelectedBatch(null)}
                          className="md:hidden p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      )}
                      <div>
                        <h2 className="text-base sm:text-xl font-black tracking-tight text-[var(--text)]">
                          {searchQuery.trim()
                            ? `Search Results (${filteredTests.length})`
                            : selectedBatch}
                        </h2>
                        <p className="text-xs text-[var(--muted)]">
                          Showing {filteredTests.length} encrypted mock tests • GB STUDY
                        </p>
                      </div>
                    </div>

                    {/* Attempt status filter pills */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[var(--card)] p-1 rounded-xl border border-[var(--border)]">
                      {(['all', 'unattempted', 'attempted'] as const).map((att) => (
                        <button
                          key={att}
                          onClick={() => setAttemptFilter(att)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                            attemptFilter === att
                              ? 'bg-blue-600 text-white'
                              : 'text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {att}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Chips Bar (when not searching) */}
                  {!searchQuery.trim() && (
                    <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                              : 'bg-[var(--card)] text-[var(--muted)] border border-[var(--border)] hover:border-blue-500/40'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tests Cards List / Grid */}
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-36 rounded-2xl bg-[var(--card)] border border-[var(--border)] animate-pulse"
                        />
                      ))}
                    </div>
                  ) : filteredTests.length === 0 ? (
                    <div className="py-16 text-center bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                      <p className="text-base font-bold mb-1 text-[var(--text)]">
                        No matching mock tests found
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Try clearing your search query or switching categories.
                      </p>
                    </div>
                  ) : (
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 pb-12'
                          : 'flex flex-col gap-3 pb-12'
                      }
                    >
                      {filteredTests.map((test) => (
                        <TestCard
                          key={test.id}
                          test={test}
                          viewMode={viewMode}
                          attemptedData={testHistory[String(test.id)]}
                          onStartTest={(t) => setActiveExamTest(t)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Candidate / Founder Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        completedCount={completedCount}
        onResetHistory={handleResetHistory}
      />
    </>
  );
}
