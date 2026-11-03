import React, { useEffect, useState } from 'react';
import { GB_LOGO_URL, FOUNDER_NAME } from '../services/api.ts';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => (p < 100 ? p + 5 : 100));
    }, 60);

    const fadeTimeout = setTimeout(() => {
      setFading(true);
    }, 1800);

    const finishTimeout = setTimeout(() => {
      setVisible(false);
      onFinish();
    }, 2200);

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimeout);
      clearTimeout(finishTimeout);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#050507] text-white transition-all duration-500 ${
        fading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/20 rounded-full blur-[110px]" />
      </div>

      <div className="flex-1" />

      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        <div className="relative group mb-7">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-3xl blur opacity-75 animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-zinc-900 flex items-center justify-center p-1">
            <img
              src={GB_LOGO_URL}
              alt="GB STUDY Logo"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase text-center">
          GB <span className="text-blue-500 font-light">STUDY</span>
        </h1>

        <p className="text-[10px] sm:text-xs font-bold text-zinc-400 tracking-[0.35em] uppercase mt-2">
          by {FOUNDER_NAME}
        </p>

        <div className="w-52 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-8">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-100 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-[10px] text-zinc-500 mt-2 font-mono">
          Loading Vault Database {progress}%
        </span>
      </div>

      <div className="relative z-10 flex-1 flex items-end pb-8">
        <p className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">
          © All Copyrights Reserved • {FOUNDER_NAME}
        </p>
      </div>
    </div>
  );
};
