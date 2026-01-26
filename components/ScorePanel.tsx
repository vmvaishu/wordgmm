
import React from 'react';
import { GameMode, Difficulty } from '../types';

interface ScorePanelProps {
  username: string;
  score: number;
  level: number;
  combo: number;
  timeLeft: number;
  mode: GameMode;
  difficulty: Difficulty;
}

const ScorePanel: React.FC<ScorePanelProps> = ({ username, score, level, combo, timeLeft, mode, difficulty }) => {
  const isTimed = mode === GameMode.TIMED;
  const getProgress = () => {
    return Math.min((level / 100) * 100, 100);
  };

  const getDifficultyStyles = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.EASY: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
      case Difficulty.MEDIUM: return 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]';
      case Difficulty.HARD: return 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/40';
    }
  };

  const getProgressColor = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.EASY: return 'bg-emerald-500';
      case Difficulty.MEDIUM: return 'bg-amber-500';
      case Difficulty.HARD: return 'bg-rose-500';
      default: return 'bg-indigo-500';
    }
  };

  return (
    <div className="w-full max-w-2xl px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col gap-3 sm:gap-6 text-white font-outfit bg-white/5 backdrop-blur-2xl rounded-[1.5rem] sm:rounded-[3rem] border border-white/10 shadow-2xl relative overflow-visible">
      
      <div className="absolute -top-3 left-4 sm:-top-4 sm:left-6 flex items-center gap-2 z-10">
        <div className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-full border border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white italic truncate max-w-[100px] sm:max-w-none">AGENT: {username || 'UNIDENTIFIED'}</span>
        </div>
      </div>

      <div className="flex flex-row items-center sm:items-end justify-between mt-3 sm:mt-2 gap-2">
        <div className="flex flex-col gap-1">
          {!isTimed ? (
            <div className="flex flex-col leading-none">
              <span className="text-[7px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-indigo-400 font-black mb-0.5 sm:mb-1">Sector Progress</span>
              <span className="text-xl sm:text-3xl md:text-5xl font-black italic tracking-tighter">
                {level}
                <span className="text-[10px] sm:text-sm md:text-xl opacity-30 ml-0.5 sm:ml-1">/100</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col leading-none">
              <span className="text-[7px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-rose-400 font-black mb-0.5 sm:mb-1">Blitz Mode</span>
              <span className="text-xl sm:text-3xl md:text-5xl font-black italic tracking-tighter text-rose-500">
                ACTIVE
              </span>
            </div>
          )}
          <div className={`px-2 sm:px-4 py-0.5 sm:py-1 rounded-full border text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-center transition-all duration-500 ${getDifficultyStyles(difficulty)}`}>
            {difficulty}
          </div>
        </div>

        <div className="flex flex-col items-center relative flex-1 sm:flex-none">
          <span className="text-[7px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-indigo-400 font-black mb-0.5 sm:mb-1">Wallet</span>
          <div className="relative flex items-center gap-1 sm:gap-2">
            <div className="hidden xs:flex w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)] border border-yellow-200">
              <span className="text-yellow-950 font-black text-[10px] sm:text-sm">$</span>
            </div>
            <span className="text-2xl sm:text-4xl md:text-6xl font-black tabular-nums tracking-tighter drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
              {score.toLocaleString()}
            </span>
            {combo > 1 && (
              <div className="absolute -top-2 sm:-top-4 -right-4 sm:-right-16 animate-bounce">
                <div className="bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 px-1 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-2xl shadow-xl border border-white/20 transform scale-[0.7] sm:scale-100">
                  <span className="text-[8px] sm:text-xs font-black text-white italic whitespace-nowrap">x{combo}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end leading-none">
          {mode === GameMode.TIMED ? (
            <>
              <span className="text-[7px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-rose-400 font-black mb-0.5 sm:mb-1 text-right">Time</span>
              <span className={`text-xl sm:text-2xl md:text-4xl font-black tabular-nums ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                {Math.max(0, timeLeft)}<span className="text-[10px] sm:text-xs md:text-lg ml-0.5 opacity-50">s</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-[7px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-indigo-400 font-black mb-0.5 sm:mb-1 text-right">System</span>
              <span className="text-sm sm:text-lg md:text-2xl font-black text-emerald-400 tracking-tight uppercase">{mode.replace('_', ' ')}</span>
            </>
          )}
        </div>
      </div>

      {!isTimed && (
        <div className="w-full space-y-1 sm:space-y-2 pt-1 sm:pt-0">
          <div className="flex justify-between items-center px-1">
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Domain Clearance</span>
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{Math.round(getProgress())}%</span>
          </div>
          <div className="h-1.5 sm:h-2.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <div 
              className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressColor(difficulty)} shadow-[0_0_15px_currentColor]`}
              style={{ width: `${getProgress()}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScorePanel;
