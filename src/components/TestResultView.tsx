import React, { useState, useEffect } from 'react';
import { Section, UserQuestionState, ExamReport } from '../types/index.ts';
import { GB_TELEGRAM_URL, FOUNDER_NAME } from '../services/api.ts';
import { extractQuestionData } from '../services/questionHelper.ts';
import { Award, CheckCircle, XCircle, BarChart3, ArrowLeft, Send, BookOpen } from 'lucide-react';

interface TestResultViewProps {
  testName: string;
  sections: Section[];
  userAnswers: Record<number, Record<number, UserQuestionState>>;
  report: ExamReport;
  onBackToDashboard: () => void;
}

export const TestResultView: React.FC<TestResultViewProps> = ({
  testName,
  sections,
  userAnswers,
  report,
  onBackToDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'solutions'>('summary');
  const [selectedSecIdx, setSelectedSecIdx] = useState(0);
  const [selectedQIdx, setSelectedQIdx] = useState(0);
  const [solutionFilter, setSolutionFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // Trigger MathJax typeset on solution change
  useEffect(() => {
    if (activeTab === 'solutions' && (window as any).MathJax?.typesetPromise) {
      setTimeout(() => {
        try {
          (window as any).MathJax.typesetPromise();
        } catch (e) {}
      }, 50);
    }
  }, [activeTab, selectedSecIdx, selectedQIdx, lang, solutionFilter]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentSection = sections[selectedSecIdx] || sections[0];
  const currentQuestions = currentSection?.questions || [];

  const getFilteredQuestions = () => {
    return currentQuestions.map((q, idx) => ({ q, idx })).filter(({ q, idx }) => {
      const ans = userAnswers[selectedSecIdx]?.[idx];
      const isAttempted = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
      const isCorrect = isAttempted && ans.selectedOption === q.parsed_answer;

      if (solutionFilter === 'correct') return isCorrect;
      if (solutionFilter === 'incorrect') return isAttempted && !isCorrect;
      if (solutionFilter === 'unattempted') return !isAttempted;
      return true;
    });
  };

  const filteredList = getFilteredQuestions();
  const currentQuestionObj = currentQuestions[selectedQIdx];
  const currentAnswerState = userAnswers[selectedSecIdx]?.[selectedQIdx];

  const {
    questionText,
    questionImg,
    comprehensive,
    options,
    solutionText,
    solutionImg
  } = extractQuestionData(currentQuestionObj, lang);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#eef2f5] dark:bg-[#07070a] p-3 sm:p-6 md:p-8 font-sans overflow-y-auto text-gray-800 dark:text-gray-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <header className="bg-white dark:bg-[#0f0f14] p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-[#22222a] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2.5 py-1 rounded">
              GB STUDY Official Scorecard
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#213A5C] dark:text-white mt-1">
              Performance Report: {testName}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Time Taken: <b>{formatTime(report.timeSpent)}</b> • Exam by <b>{FOUNDER_NAME}</b>
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={onBackToDashboard}
              className="flex-1 md:flex-initial border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'summary' ? 'solutions' : 'summary')}
              className="flex-1 md:flex-initial bg-[#3A86C8] hover:bg-[#286090] text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{activeTab === 'summary' ? 'View Solutions →' : 'View Summary'}</span>
            </button>

            <a
              href={GB_TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>
          </div>
        </header>

        {activeTab === 'summary' ? (
          <>
            {/* Key KPI Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white dark:bg-[#0f0f14] p-4 rounded-2xl border border-gray-200 dark:border-[#22222a] shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Score Obtained</span>
                  <Award className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
                  {report.tScore.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Accuracy: <b className="text-emerald-500">{report.accuracy}%</b>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f0f14] p-4 rounded-2xl border border-gray-200 dark:border-[#22222a] shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Attempted</span>
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
                  {report.tAttempt} / {report.tTotal}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Total Questions: {report.tTotal}
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f0f14] p-4 rounded-2xl border border-gray-200 dark:border-[#22222a] shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Correct</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                  {report.tCorrect}
                </div>
                <div className="text-[11px] text-emerald-500 font-bold mt-0.5">
                  +{report.tCorrect} Correct answers
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f0f14] p-4 rounded-2xl border border-gray-200 dark:border-[#22222a] shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Incorrect</span>
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-red-600 mt-1">
                  {report.tAttempt - report.tCorrect}
                </div>
                <div className="text-[11px] text-red-500 font-bold mt-0.5">
                  Negative marks applied
                </div>
              </div>
            </div>

            {/* Section Breakdown Table */}
            <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-[#22222a] shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-extrabold text-sm sm:text-base text-[var(--text)]">
                  Section-wise Performance Breakdown
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-500 border-b border-gray-100 dark:border-zinc-800">
                    <tr>
                      <th className="p-3.5 font-bold">Section</th>
                      <th className="p-3.5 font-bold text-center">Total</th>
                      <th className="p-3.5 font-bold text-center">Attempted</th>
                      <th className="p-3.5 font-bold text-center">Correct</th>
                      <th className="p-3.5 font-bold text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {report.secStats.map((sec, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition">
                        <td className="p-3.5 font-bold text-[var(--text)]">{sec.name}</td>
                        <td className="p-3.5 text-center text-gray-500">{sec.total}</td>
                        <td className="p-3.5 text-center font-semibold">{sec.ans + sec.ansRev}</td>
                        <td className="p-3.5 text-center font-semibold text-emerald-600">{sec.correct}</td>
                        <td className="p-3.5 text-center font-extrabold text-blue-600">{sec.score.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Telegram Community Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div>
                <h4 className="font-black text-lg">GB STUDY Free Study Materials & DPPs</h4>
                <p className="text-xs text-blue-100 mt-1 max-w-lg">
                  Join our official Telegram community for daily test series rankings, PDF notes, lectures, and mock analysis.
                </p>
              </div>
              <a
                href={GB_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl text-xs shadow-md hover:bg-blue-50 transition shrink-0"
              >
                Join @GBFreestudy
              </a>
            </div>
          </>
        ) : (
          /* Solutions Explorer */
          <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-[#22222a] shadow-sm overflow-hidden p-4 sm:p-6 space-y-6">
            {/* Section tabs & Language selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {sections.map((sec, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSecIdx(idx);
                      setSelectedQIdx(0);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedSecIdx === idx
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {sec.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                  className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-xs font-bold hover:bg-gray-200 text-blue-600 dark:text-blue-400 cursor-pointer"
                >
                  Language: {lang === 'en' ? 'English' : 'हिंदी'}
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-bold">Filter:</span>
              {(['all', 'correct', 'incorrect', 'unattempted'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSolutionFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    solutionFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Question selection pills */}
            <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl max-h-36 overflow-y-auto custom-scrollbar">
              {filteredList.map(({ q, idx }) => {
                const ans = userAnswers[selectedSecIdx]?.[idx];
                const isAttempted = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                const isCorrect = isAttempted && ans.selectedOption === q.parsed_answer;

                let pillColor = 'bg-gray-300 text-gray-700 dark:bg-zinc-800 dark:text-gray-300';
                if (isAttempted) {
                  pillColor = isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedQIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition cursor-pointer ${pillColor} ${
                      selectedQIdx === idx ? 'ring-2 ring-blue-500 scale-110 z-10' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Active Question Solution Detail */}
            {currentQuestionObj && (
              <div className="space-y-5 border-t border-gray-100 dark:border-zinc-800 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[var(--text)]">
                    Question {selectedQIdx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold rounded">
                      +{currentQuestionObj.p_marks}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 font-bold rounded">
                      -{currentQuestionObj.n_marks}
                    </span>
                  </div>
                </div>

                {/* Comprehension / Passage if present */}
                {comprehensive && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs sm:text-sm leading-relaxed mb-4">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1 uppercase text-[10px] tracking-wider">
                      Passage / Context:
                    </span>
                    <div dangerouslySetInnerHTML={{ __html: comprehensive }} />
                  </div>
                )}

                {/* Question Body */}
                <div
                  className="text-sm leading-relaxed text-[var(--text)] prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: questionText || 'No question content'
                  }}
                />

                {/* Question Diagram / Image */}
                {questionImg && (
                  <div className="my-3">
                    <img
                      src={questionImg}
                      alt="Question Diagram"
                      className="max-h-72 max-w-full object-contain rounded-xl border border-gray-200 dark:border-zinc-800 p-1 bg-white"
                    />
                  </div>
                )}

                {/* Options with correctness highlight */}
                <div className="space-y-2.5 pt-2">
                  {options.map((opt) => {
                    const isUserChoice = currentAnswerState?.selectedOption === opt.id;
                    const isCorrectAnswer = currentQuestionObj.parsed_answer === opt.id;

                    let optClass = 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900';
                    if (isCorrectAnswer) {
                      optClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold';
                    } else if (isUserChoice && !isCorrectAnswer) {
                      optClass = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 font-bold';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition ${optClass}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold shrink-0 text-xs">
                          {opt.id}
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
                        {isCorrectAnswer && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded shrink-0">
                            Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isCorrectAnswer && (
                          <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded shrink-0">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Solution / Explanation */}
                {(solutionText || solutionImg) && (
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 mt-4">
                    <h5 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-2">
                      Explanation & Solution:
                    </h5>
                    {solutionText && (
                      <div
                        className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: solutionText }}
                      />
                    )}
                    {solutionImg && (
                      <img
                        src={solutionImg}
                        alt="Solution Diagram"
                        className="mt-3 max-h-60 object-contain rounded border border-blue-200 bg-white p-1"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
