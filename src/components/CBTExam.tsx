import React, { useState, useEffect } from 'react';
import { TestItem, Section, UserQuestionState, ExamReport, QuestionStatus } from '../types/index.ts';
import { fetchTestById, GB_LOGO_URL, FOUNDER_NAME } from '../services/api.ts';
import { extractQuestionData } from '../services/questionHelper.ts';
import { TestResultView } from './TestResultView.tsx';
import { Clock, ChevronLeft, ChevronRight, Menu, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CBTExamProps {
  test: TestItem;
  onExit: () => void;
  onSaveResult: (testId: string | number, score: number, maxScore: number) => void;
}

export const CBTExam: React.FC<CBTExamProps> = ({ test, onExit, onSaveResult }) => {
  const [phase, setPhase] = useState<'loading' | 'instructions' | 'exam' | 'result' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, Record<number, UserQuestionState>>>({});
  const [currentSecIdx, setCurrentSecIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [timeLeft, setTimeLeft] = useState(3600);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [reportData, setReportData] = useState<ExamReport | null>(null);

  // Load MathJax
  useEffect(() => {
    if (!(window as any).MathJax) {
      (window as any).MathJax = {
        tex: {
          inlineMath: [
            ['$', '$'],
            ['\\(', '\\)']
          ]
        },
        startup: { typeset: false }
      };
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const triggerMathJax = () => {
    if ((window as any).MathJax?.typesetPromise) {
      setTimeout(() => {
        try {
          (window as any).MathJax.typesetPromise();
        } catch (e) {}
      }, 60);
    }
  };

  // Fetch test questions
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPhase('loading');
        const data = await fetchTestById(test.id);
        if (!mounted) return;

        setSections(data.sections);
        setTimeLeft(data.durationMinutes * 60);

        // Initialize user answers state
        const initialAnswers: Record<number, Record<number, UserQuestionState>> = {};
        data.sections.forEach((sec, sIdx) => {
          initialAnswers[sIdx] = {};
          sec.questions.forEach((_, qIdx) => {
            initialAnswers[sIdx][qIdx] = {
              status: 'not-visited',
              selectedOption: null,
              qTime: 0
            };
          });
        });
        setUserAnswers(initialAnswers);
        setPhase('instructions');
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage(err.message || 'Failed to decrypt test vault');
        setPhase('error');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [test.id]);

  // Typeset math on question change
  useEffect(() => {
    triggerMathJax();
  }, [currentSecIdx, currentQIdx, lang, phase]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'exam' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((s) => s + 1);

      // Track time on active question
      setUserAnswers((prev) => {
        const cur = prev[currentSecIdx]?.[currentQIdx];
        if (!cur) return prev;
        return {
          ...prev,
          [currentSecIdx]: {
            ...prev[currentSecIdx],
            [currentQIdx]: {
              ...cur,
              qTime: (cur.qTime || 0) + 1
            }
          }
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, timeLeft, currentSecIdx, currentQIdx]);

  const updateQuestionState = (secIdx: number, qIdx: number, updates: Partial<UserQuestionState>) => {
    setUserAnswers((prev) => ({
      ...prev,
      [secIdx]: {
        ...prev[secIdx],
        [qIdx]: {
          ...prev[secIdx][qIdx],
          ...updates
        }
      }
    }));
  };

  const navigateToQuestion = (secIdx: number, qIdx: number) => {
    const curStatus = userAnswers[secIdx]?.[qIdx]?.status;
    if (curStatus === 'not-visited' && phase === 'exam') {
      updateQuestionState(secIdx, qIdx, { status: 'not-answered' });
    }
    setCurrentSecIdx(secIdx);
    setCurrentQIdx(qIdx);
    setIsPaletteOpen(false);
  };

  const handleSelectOption = (optNum: number) => {
    updateQuestionState(currentSecIdx, currentQIdx, { selectedOption: optNum });
  };

  const handleClearResponse = () => {
    updateQuestionState(currentSecIdx, currentQIdx, {
      selectedOption: null,
      status: 'not-answered'
    });
  };

  const handleSaveAndNext = () => {
    const cur = userAnswers[currentSecIdx]?.[currentQIdx];
    const newStatus: QuestionStatus = cur?.selectedOption !== null && cur?.selectedOption !== undefined ? 'answered' : 'not-answered';
    updateQuestionState(currentSecIdx, currentQIdx, { status: newStatus });

    const curSec = sections[currentSecIdx];
    if (currentQIdx < curSec.questions.length - 1) {
      navigateToQuestion(currentSecIdx, currentQIdx + 1);
    } else if (currentSecIdx < sections.length - 1) {
      navigateToQuestion(currentSecIdx + 1, 0);
    }
  };

  const handleMarkForReviewAndNext = () => {
    const cur = userAnswers[currentSecIdx]?.[currentQIdx];
    const newStatus: QuestionStatus = cur?.selectedOption !== null && cur?.selectedOption !== undefined ? 'ans-review' : 'review';
    updateQuestionState(currentSecIdx, currentQIdx, { status: newStatus });

    const curSec = sections[currentSecIdx];
    if (currentQIdx < curSec.questions.length - 1) {
      navigateToQuestion(currentSecIdx, currentQIdx + 1);
    } else if (currentSecIdx < sections.length - 1) {
      navigateToQuestion(currentSecIdx + 1, 0);
    }
  };

  const calculateReport = (): ExamReport => {
    let tScore = 0;
    let tAttempt = 0;
    let tCorrect = 0;
    let tTotal = 0;

    const secStats = sections.map((sec, sIdx) => {
      let ans = 0;
      let notAns = 0;
      let notVis = 0;
      let rev = 0;
      let ansRev = 0;
      let correct = 0;
      let score = 0;

      sec.questions.forEach((q, qIdx) => {
        const u = userAnswers[sIdx]?.[qIdx] || {
          status: 'not-visited',
          selectedOption: null,
          qTime: 0
        };

        if (u.status === 'answered') ans++;
        else if (u.status === 'not-answered') notAns++;
        else if (u.status === 'not-visited') notVis++;
        else if (u.status === 'review') rev++;
        else if (u.status === 'ans-review') ansRev++;

        if (u.selectedOption !== null && u.selectedOption !== undefined) {
          if (u.selectedOption === q.parsed_answer) {
            correct++;
            score += q.p_marks;
          } else {
            score -= q.n_marks;
          }
        }
      });

      tScore += score;
      tAttempt += ans + ansRev;
      tCorrect += correct;
      tTotal += sec.questions.length;

      return {
        name: sec.name,
        total: sec.questions.length,
        ans,
        notAns,
        notVis,
        rev,
        ansRev,
        correct,
        score
      };
    });

    const accuracy = tAttempt > 0 ? ((tCorrect / tAttempt) * 100).toFixed(1) : '0.0';

    return {
      secStats,
      tScore,
      tAttempt,
      tCorrect,
      tTotal,
      accuracy,
      timeSpent
    };
  };

  const handleSubmitTest = () => {
    const report = calculateReport();
    setReportData(report);
    setShowSubmitModal(false);
    setPhase('result');
    onSaveResult(test.id, report.tScore, report.tTotal);
  };

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Question status styling
  const getPaletteStyle = (status: QuestionStatus, isCurrent: boolean) => {
    let base = 'w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs font-bold transition-all relative cursor-pointer ';
    if (isCurrent) {
      base += 'ring-2 ring-offset-2 ring-blue-600 scale-105 z-10 ';
    }
    switch (status) {
      case 'answered':
        return base + 'bg-[#00a651] text-white rounded-b-xl rounded-t-sm shadow-sm';
      case 'not-answered':
        return base + 'bg-[#e53935] text-white rounded-t-xl rounded-b-sm shadow-sm';
      case 'review':
        return base + 'bg-[#652d90] text-white rounded-full shadow-sm';
      case 'ans-review':
        return base + 'bg-[#652d90] text-white rounded-full shadow-sm relative after:content-[""] after:w-2 after:h-2 after:bg-emerald-400 after:rounded-full after:absolute after:bottom-0 after:right-0';
      case 'not-visited':
      default:
        return base + 'bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-md border border-gray-300 dark:border-zinc-700';
    }
  };

  // Current question data extraction
  const currentSection = sections[currentSecIdx];
  const currentQuestion = currentSection?.questions?.[currentQIdx];
  const currentAnswer = userAnswers[currentSecIdx]?.[currentQIdx];

  const {
    questionText,
    questionImg,
    comprehensive,
    options
  } = extractQuestionData(currentQuestion, lang);

  // Overall counts for summary
  const getOverallCounts = () => {
    let ans = 0;
    let notAns = 0;
    let notVis = 0;
    let rev = 0;
    let ansRev = 0;

    sections.forEach((sec, sIdx) => {
      sec.questions.forEach((_, qIdx) => {
        const u = userAnswers[sIdx]?.[qIdx]?.status || 'not-visited';
        if (u === 'answered') ans++;
        else if (u === 'not-answered') notAns++;
        else if (u === 'not-visited') notVis++;
        else if (u === 'review') rev++;
        else if (u === 'ans-review') ansRev++;
      });
    });

    return { ans, notAns, notVis, rev, ansRev };
  };

  // 1. Loading Phase
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#050507] text-white flex flex-col items-center justify-center p-6">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/20 p-2 shadow-2xl flex items-center justify-center animate-pulse">
            <img src={GB_LOGO_URL} alt="GB STUDY" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight">GB STUDY Examination Vault</h2>
        <p className="text-xs text-blue-400 font-mono mt-2 animate-pulse">
          🔒 Decrypting Test #{test.id} & Generating Questions...
        </p>
      </div>
    );
  }

  // 2. Error Phase
  if (phase === 'error') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#050507] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-3xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-red-500">Vault Access Error</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">{errorMessage}</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onExit}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-bold hover:bg-zinc-800 cursor-pointer"
            >
              Exit to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Result Phase
  if (phase === 'result' && reportData) {
    return (
      <TestResultView
        testName={test.test_name}
        sections={sections}
        userAnswers={userAnswers}
        report={reportData}
        onBackToDashboard={onExit}
      />
    );
  }

  // 4. Instructions Phase
  if (phase === 'instructions') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f4f6f8] dark:bg-[#07070a] text-gray-800 dark:text-gray-200 overflow-y-auto font-sans flex flex-col">
        {/* Exam Title Header */}
        <header className="bg-[#213A5C] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <img src={GB_LOGO_URL} alt="GB STUDY" className="w-8 h-8 rounded-lg bg-white p-0.5 object-contain" />
            <div>
              <h1 className="text-sm sm:text-base font-bold leading-tight truncate max-w-md">
                {test.test_name}
              </h1>
              <p className="text-[10px] text-blue-200">GB STUDY CBT Examination Platform</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            ← Exit Test
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
          {/* Candidate Card */}
          <div className="bg-white dark:bg-[#0f0f14] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={GB_LOGO_URL}
                alt={FOUNDER_NAME}
                className="w-14 h-14 rounded-xl object-contain border border-blue-500 p-0.5 bg-white shadow-sm"
              />
              <div>
                <h2 className="font-extrabold text-base text-[var(--text)]">{FOUNDER_NAME}</h2>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  Batch: {test.package_name}
                </p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Roll / Test ID: #{test.id}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-gray-400 block uppercase">Total Duration</span>
              <span className="text-lg font-black text-blue-600">{Math.floor(timeLeft / 60)} Mins</span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-white dark:bg-[#0f0f14] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4 text-xs sm:text-sm leading-relaxed">
            <h3 className="text-base font-black text-[#213A5C] dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-2">
              General Examination Instructions:
            </h3>

            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                The clock will be set at the server. The countdown timer in the top right corner of the screen will display the remaining time available for you to complete the examination.
              </li>
              <li>
                When the timer reaches zero, the examination will end automatically by default. You are not required to end or submit your examination.
              </li>
              <li>
                The Question Palette displayed on the right side of the screen will show the status of each question using one of the following symbols:
              </li>
            </ol>

            {/* Symbol Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-md bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs border border-gray-300">
                  1
                </span>
                <span className="text-xs">You have not visited the question yet.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-t-xl rounded-b-sm bg-[#e53935] text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <span className="text-xs">You have not answered the question.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-b-xl rounded-t-sm bg-[#00a651] text-white flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <span className="text-xs">You have answered the question.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#652d90] text-white flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <span className="text-xs">You have marked the question for review.</span>
              </div>
            </div>

            {/* Language Selection */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-zinc-800">
              <span className="font-bold text-xs text-gray-500">Choose Default Question Language:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    lang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang('hi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    lang === 'hi' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="accept-terms"
                checked={instructionsAccepted}
                onChange={(e) => setInstructionsAccepted(e.target.checked)}
                className="mt-1 cursor-pointer w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="accept-terms" className="text-xs cursor-pointer select-none">
                I have read and understood all the instructions above. All computer hardware allotted to me are in proper working condition. I agree to comply with all rules and begin the mock test.
              </label>
            </div>
          </div>

          {/* Start Test Button */}
          <div className="text-center pb-6">
            <button
              onClick={() => {
                if (instructionsAccepted) {
                  setPhase('exam');
                  // Mark question 0 of section 0 as not-answered
                  updateQuestionState(0, 0, { status: 'not-answered' });
                }
              }}
              disabled={!instructionsAccepted}
              className={`px-8 py-3.5 rounded-2xl text-sm font-black tracking-wide uppercase transition-all shadow-lg cursor-pointer ${
                instructionsAccepted
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
                  : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              I am ready to begin →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Exam Phase (CBT Platform)
  const counts = getOverallCounts();

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f4f6f8] dark:bg-[#07070a] text-gray-800 dark:text-gray-200 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="h-14 bg-[#213A5C] text-white px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-md z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={GB_LOGO_URL} alt="GB STUDY" className="w-7 h-7 rounded-md bg-white p-0.5 object-contain shrink-0" />
          <h1 className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md">
            {test.test_name}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-blue-200 rounded text-xs font-bold transition cursor-pointer"
          >
            {lang === 'en' ? 'Language: EN' : 'Language: HI'}
          </button>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/30 rounded-lg border border-white/10 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className={timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}>
              {formatTimer(timeLeft)}
            </span>
          </div>

          {/* Mobile palette toggle */}
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="md:hidden p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sections Bar */}
      <div className="bg-white dark:bg-[#0f0f14] border-b border-gray-200 dark:border-zinc-800 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 shrink-0 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2">
          {sections.map((sec, sIdx) => {
            const answeredInSec = Object.values(userAnswers[sIdx] || {}).filter(
              (u) => u.status === 'answered' || u.status === 'ans-review'
            ).length;

            const isCurrent = currentSecIdx === sIdx;
            return (
              <button
                key={sIdx}
                onClick={() => navigateToQuestion(sIdx, 0)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <span>{sec.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isCurrent ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {answeredInSec}/{sec.questions.length}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition shadow-sm shrink-0 cursor-pointer"
        >
          Submit Test
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Question Area */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#0b0b0e] custom-scrollbar">
          {currentQuestion ? (
            <div className="space-y-5 max-w-4xl">
              {/* Question Meta Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-[#213A5C] dark:text-white">
                    Question No. {currentQIdx + 1}
                  </span>
                  <span className="text-xs text-gray-400">of {currentSection.questions.length}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    +{currentQuestion.p_marks} Marks
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                    -{currentQuestion.n_marks} Negative
                  </span>
                </div>
              </div>

              {/* Comprehension / Passage if available */}
              {comprehensive && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs sm:text-sm leading-relaxed mb-4">
                  <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1 uppercase text-[10px] tracking-wider">
                    Passage / Context:
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: comprehensive }} />
                </div>
              )}

              {/* Question Text */}
              <div
                className="text-sm sm:text-base leading-relaxed text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: questionText || 'Question text unavailable.'
                }}
              />

              {/* Question Diagram / Image if available */}
              {questionImg && (
                <div className="my-3">
                  <img
                    src={questionImg}
                    alt="Question Diagram"
                    className="max-h-72 max-w-full object-contain rounded-xl border border-gray-200 dark:border-zinc-800 p-1 bg-white"
                  />
                </div>
              )}

              {/* Multiple Choice Options List */}
              <div className="space-y-3 pt-3">
                {options.length > 0 ? (
                  options.map((opt) => {
                    const isSelected = currentAnswer?.selectedOption === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-sm font-semibold'
                            : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/40 hover:bg-gray-100/50 dark:hover:bg-zinc-900/70'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="font-extrabold text-gray-500 shrink-0 text-xs mt-0.5">
                          ({opt.id})
                        </span>
                        <div className="flex-1 min-w-0">
                          {opt.text && (
                            <div
                              className="prose dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: opt.text }}
                            />
                          )}
                          {opt.img && (
                            <img
                              src={opt.img}
                              alt={`Option ${opt.id}`}
                              className="mt-2 max-h-48 max-w-full object-contain rounded border border-gray-200 dark:border-zinc-800 p-1 bg-white"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 dark:bg-zinc-900 rounded-xl">
                    No options listed for this question.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">Question not found.</div>
          )}

          {/* Bottom Action Controls */}
          <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 mt-8">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSaveAndNext}
                className="px-4 sm:px-5 py-2.5 bg-[#00a651] hover:bg-[#008f45] text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Save & Next
              </button>

              <button
                onClick={handleMarkForReviewAndNext}
                className="px-4 sm:px-5 py-2.5 bg-[#652d90] hover:bg-[#532477] text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Mark for Review & Next
              </button>

              <button
                onClick={handleClearResponse}
                className="px-3.5 py-2.5 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentQIdx > 0) {
                    navigateToQuestion(currentSecIdx, currentQIdx - 1);
                  } else if (currentSecIdx > 0) {
                    const prevSecLen = sections[currentSecIdx - 1].questions.length;
                    navigateToQuestion(currentSecIdx - 1, prevSecLen - 1);
                  }
                }}
                disabled={currentSecIdx === 0 && currentQIdx === 0}
                className="px-3.5 py-2.5 border border-gray-300 dark:border-zinc-700 disabled:opacity-40 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => {
                  if (currentQIdx < currentSection.questions.length - 1) {
                    navigateToQuestion(currentSecIdx, currentQIdx + 1);
                  } else if (currentSecIdx < sections.length - 1) {
                    navigateToQuestion(currentSecIdx + 1, 0);
                  }
                }}
                disabled={
                  currentSecIdx === sections.length - 1 &&
                  currentQIdx === currentSection.questions.length - 1
                }
                className="px-4 py-2.5 border border-gray-300 dark:border-zinc-700 disabled:opacity-40 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Candidate & Palette Drawer */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-72 sm:w-80 bg-white dark:bg-[#0f0f14] border-l border-gray-200 dark:border-zinc-800 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
            isPaletteOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Candidate Profile Box */}
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <img
                src={GB_LOGO_URL}
                alt={FOUNDER_NAME}
                className="w-11 h-11 rounded-xl object-contain border border-blue-500 p-0.5 bg-white shadow-sm"
              />
              <div>
                <h4 className="font-extrabold text-xs text-[#213A5C] dark:text-white">{FOUNDER_NAME}</h4>
                <p className="text-[10px] text-emerald-600 font-bold">Candidate Active</p>
                <p className="text-[9px] text-gray-400 font-mono">Roll: #{test.id}</p>
              </div>
            </div>

            <button
              onClick={() => setIsPaletteOpen(false)}
              className="md:hidden p-1.5 text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Question Status Legend */}
          <div className="p-3 border-b border-gray-200 dark:border-zinc-800 grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-b-lg rounded-t-sm bg-[#00a651] text-white flex items-center justify-center font-bold text-[10px]">
                {counts.ans}
              </span>
              <span className="text-gray-600 dark:text-gray-400">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-t-lg rounded-b-sm bg-[#e53935] text-white flex items-center justify-center font-bold text-[10px]">
                {counts.notAns}
              </span>
              <span className="text-gray-600 dark:text-gray-400">Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-[10px] border border-gray-300">
                {counts.notVis}
              </span>
              <span className="text-gray-600 dark:text-gray-400">Not Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#652d90] text-white flex items-center justify-center font-bold text-[10px]">
                {counts.rev + counts.ansRev}
              </span>
              <span className="text-gray-600 dark:text-gray-400">Marked Review</span>
            </div>
          </div>

          {/* Palette Questions Grid */}
          <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar">
            <h5 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2">
              {currentSection?.name} (Questions)
            </h5>
            <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
              {currentSection?.questions.map((_, qIdx) => {
                const u = userAnswers[currentSecIdx]?.[qIdx];
                const status: QuestionStatus = u?.status || 'not-visited';
                const isCurrent = currentQIdx === qIdx;

                return (
                  <button
                    key={qIdx}
                    onClick={() => navigateToQuestion(currentSecIdx, qIdx)}
                    className={getPaletteStyle(status, isCurrent)}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Test Button in Sidebar */}
          <div className="p-3.5 border-t border-gray-200 dark:border-zinc-800">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              Submit Exam
            </button>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f0f14] border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-[#213A5C] dark:text-white">
              Are you sure you want to submit?
            </h3>
            <p className="text-xs text-gray-500">
              Please review your summary below before final submission.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs p-3.5 bg-gray-50 dark:bg-zinc-900 rounded-2xl text-left">
              <div>
                Total Questions: <b>{counts.ans + counts.notAns + counts.notVis + counts.rev + counts.ansRev}</b>
              </div>
              <div className="text-emerald-600 font-bold">
                Answered: {counts.ans + counts.ansRev}
              </div>
              <div className="text-red-600 font-bold">
                Not Answered: {counts.notAns}
              </div>
              <div className="text-purple-600 font-bold">
                Marked for Review: {counts.rev + counts.ansRev}
              </div>
              <div className="text-gray-400">
                Not Visited: {counts.notVis}
              </div>
              <div className="text-blue-600 font-bold">
                Time Remaining: {formatTimer(timeLeft)}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                No, Resume
              </button>
              <button
                onClick={handleSubmitTest}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
