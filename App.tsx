
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WORDS } from './data/words';
import { Difficulty, GameMode, GameState, Genre, WordEntry } from './types';
import { audioService } from './services/audioService';
import LetterTile from './components/LetterTile';
import ScorePanel from './components/ScorePanel';

interface UserProfile {
  username: string;
  score: number;
  domainLevels: Record<string, number>;
  dailyStreak: number;
  lastPlayDate: string;
  playedWords: string[];
}

const VaultIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M20 25 L50 10 L80 25 L80 75 L50 90 L20 75 Z" fill="none" stroke="url(#vaultGrad)" strokeWidth="8" />
    <circle cx="50" cy="50" r="15" fill="url(#vaultGrad)" className="animate-pulse" />
    <g stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.8">
      <path d="M50 35 L50 20" />
      <path d="M65 50 L80 50" />
      <path d="M50 65 L50 80" />
      <path d="M35 50 L20 50" />
    </g>
  </svg>
);

const GameLogo = () => (
  <div className="relative group cursor-default flex flex-col items-center">
    <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full scale-150 opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
    <div className="mb-2 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
      <VaultIcon className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
    </div>
    <svg viewBox="0 0 400 140" className="w-full max-w-[280px] sm:max-w-md drop-shadow-[0_0_20px_rgba(99,102,241,0.4)] overflow-visible">
      <defs>
        <linearGradient id="vaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <text x="50%" y="55" textAnchor="middle" className="font-outfit text-7xl font-black italic tracking-tighter" fill="url(#vaultGradient)" filter="url(#glow)">
        WORD
      </text>
      <text x="50%" y="115" textAnchor="middle" className="font-outfit text-8xl font-black tracking-[0.15em]" fill="white" style={{ opacity: 0.95 }}>
        VAULT
      </text>
      <path d="M80,130 L320,130" stroke="url(#vaultGradient)" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
      <circle cx="50%" cy="130" r="4" fill="#818cf8" className="animate-ping" />
    </svg>
  </div>
);

const App: React.FC = () => {
  const [registry, setRegistry] = useState<Record<string, UserProfile>>({});
  const [renameInput, setRenameInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [lastReward, setLastReward] = useState(0);
  const [isTracing, setIsTracing] = useState(false);
  
  useEffect(() => {
    setRegistry(getAllUsers());
  }, []);

  const getAllUsers = (): Record<string, UserProfile> => {
    try {
      const stored = localStorage.getItem('vault_registry');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const getActiveAgentName = (): string => localStorage.getItem('active_vault_agent') || '';

  const saveUserData = (username: string, data: Partial<UserProfile>) => {
    const currentRegistry = getAllUsers();
    const current = currentRegistry[username] || {
      username,
      score: 0,
      domainLevels: {},
      dailyStreak: 1,
      lastPlayDate: new Date().toDateString(),
      playedWords: [],
    };
    const updatedUser = { ...current, ...data };
    currentRegistry[username] = updatedUser;
    localStorage.setItem('vault_registry', JSON.stringify(currentRegistry));
    setRegistry({ ...currentRegistry });
  };

  const deleteAgent = (username: string) => {
    const currentRegistry = getAllUsers();
    if (currentRegistry[username]) {
      delete currentRegistry[username];
      localStorage.setItem('vault_registry', JSON.stringify(currentRegistry));
      setRegistry({ ...currentRegistry });
      if (state.username === username) handleLogout();
      audioService.playWrong();
    }
  };

  const renameAgent = (oldName: string, newName: string) => {
    const cleanNewName = newName.trim().toUpperCase();
    if (!cleanNewName || cleanNewName.length < 3) return;
    const currentRegistry = getAllUsers();
    if (currentRegistry[cleanNewName] && cleanNewName !== oldName) {
      alert("AGENT NAME ALREADY IN USE");
      return;
    }
    const userData = currentRegistry[oldName];
    if (userData) {
      userData.username = cleanNewName;
      currentRegistry[cleanNewName] = userData;
      if (oldName !== cleanNewName) delete currentRegistry[oldName];
      localStorage.setItem('vault_registry', JSON.stringify(currentRegistry));
      setRegistry({ ...currentRegistry });
      if (state.username === oldName) {
        localStorage.setItem('active_vault_agent', cleanNewName);
        setState(prev => ({ ...prev, username: cleanNewName }));
      }
      audioService.playLevelUp();
    }
    setRenameInput('');
    setShowSettings(false);
  };

  const [state, setState] = useState<GameState>(() => {
    const activeName = getActiveAgentName();
    const initialRegistry = getAllUsers();
    const user = initialRegistry[activeName];

    return {
      username: activeName,
      score: user?.score || 0,
      level: 1,
      domainLevels: user?.domainLevels || {},
      combo: 1,
      timeLeft: 60,
      currentWord: '',
      currentClue: '',
      difficulty: Difficulty.EASY,
      genre: Genre.ANIMALS,
      scrambled: [],
      input: [],
      isCorrect: null,
      status: activeName ? 'MAIN_MENU' : 'PROFILE_CREATE',
      mode: GameMode.RIDDLE,
      playedWords: user?.playedWords || [],
    };
  });

  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [profileInput, setProfileInput] = useState('');

  useEffect(() => {
    let timerId: number;
    if (state.mode === GameMode.TIMED && (state.status === 'PLAYING' || state.status === 'RIDDLE_PLAYING') && state.timeLeft > 0) {
      timerId = window.setInterval(() => {
        setState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (state.timeLeft === 0 && state.mode === GameMode.TIMED && (state.status === 'PLAYING' || state.status === 'RIDDLE_PLAYING')) {
      setState(prev => ({ ...prev, status: 'GAMEOVER' }));
      audioService.playWrong();
    }
    return () => clearInterval(timerId);
  }, [state.status, state.timeLeft, state.mode]);

  useEffect(() => {
    if (state.username) {
      saveUserData(state.username, {
        score: state.score,
        domainLevels: state.domainLevels,
        playedWords: state.playedWords,
      });
    }
  }, [state.score, state.domainLevels, state.playedWords, state.username]);

  const shuffle = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const updateDailyStreak = (username: string) => {
    const users = getAllUsers();
    const user = users[username];
    if (!user) return;

    const today = new Date().toDateString();
    const lastPlay = user.lastPlayDate;
    if (lastPlay === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreak = 1;
    if (lastPlay === yesterdayStr) {
      newStreak = (user.dailyStreak || 0) + 1;
    }

    saveUserData(username, {
      dailyStreak: newStreak,
      lastPlayDate: today
    });
  };

  const getNewWord = useCallback(
    (level: number, genre: Genre, currentPlayedWords: string[], isSpecial: boolean) => {
      const genrePool = WORDS.filter(
        (w) => w.genre === genre && (!isSpecial || w.clue) && !currentPlayedWords.includes(w.word.toUpperCase())
      );
      if (genrePool.length === 0) return null;

      const easyWords = genrePool.filter(w => w.difficulty === Difficulty.EASY);
      const mediumWords = genrePool.filter(w => w.difficulty === Difficulty.MEDIUM);
      const hardWords = genrePool.filter(w => w.difficulty === Difficulty.HARD);

      let targetPool: WordEntry[];
      if (level <= 35 && easyWords.length > 0) targetPool = easyWords;
      else if (level <= 70 && mediumWords.length > 0) targetPool = mediumWords;
      else targetPool = hardWords.length > 0 ? hardWords : genrePool;

      const randomIndex = Math.floor(Math.random() * targetPool.length);
      const entry = targetPool[randomIndex];
      const word = entry.word.toUpperCase();

      return {
        word,
        clue: entry.clue || 'Decipher this sequence!',
        scrambled: shuffle(word.split('')),
        difficulty: entry.difficulty,
      };
    },
    []
  );

  const loginAgent = (name: string) => {
    const currentRegistry = getAllUsers();
    const user = currentRegistry[name];
    localStorage.setItem('active_vault_agent', name);
    audioService.playLevelUp();
    updateDailyStreak(name);
    if (user) {
      setState((prev) => ({
        ...prev,
        username: name,
        score: user.score,
        domainLevels: user.domainLevels,
        playedWords: user.playedWords,
        status: 'MAIN_MENU',
      }));
    } else {
      saveUserData(name, { username: name, dailyStreak: 1, lastPlayDate: new Date().toDateString() });
      setState((prev) => ({
        ...prev,
        username: name,
        score: 0,
        domainLevels: {},
        playedWords: [],
        status: 'MAIN_MENU',
      }));
    }
  };

  const handleLogout = () => {
    audioService.playWrong();
    localStorage.removeItem('active_vault_agent');
    setProfileInput('');
    setShowSettings(false);
    setState((prev) => ({
      ...prev,
      username: '',
      score: 0,
      domainLevels: {},
      playedWords: [],
      status: 'PROFILE_CREATE',
    }));
  };

  const selectGenre = (genre: Genre) => {
    audioService.playClick();
    setState((prev) => ({
      ...prev,
      genre,
      status: 'START'
    }));
  };

  const initGame = (mode: GameMode) => {
    const levelKey = `${state.genre}_${mode}`;
    const currentLvl = mode === GameMode.TIMED ? 1 : (state.domainLevels[levelKey] || 1);
    
    if (currentLvl > 100 && mode !== GameMode.TIMED) {
      setState(prev => ({ ...prev, status: 'DOMAIN_MASTERED' }));
      return;
    }

    const isSpecial = mode === GameMode.RIDDLE || mode === GameMode.WORD_LINK;
    const result = getNewWord(currentLvl, state.genre, state.playedWords, isSpecial);
    
    if (!result) {
      setState(prev => ({ ...prev, status: 'DOMAIN_MASTERED' }));
      return;
    }

    const { word, clue, scrambled, difficulty } = result;
    updateDailyStreak(state.username);
    setState((prev) => ({
      ...prev,
      combo: 1,
      level: currentLvl,
      timeLeft: mode === GameMode.TIMED ? 60 : 0,
      currentWord: word,
      currentClue: clue,
      difficulty,
      scrambled,
      input: [],
      isCorrect: null,
      status: isSpecial ? 'RIDDLE_PLAYING' : 'PLAYING',
      mode,
    }));
    setUsedIndices([]);
    setIsTracing(false);
  };

  const handleLetterClick = (char: string, index: number) => {
    if (state.isCorrect !== null || usedIndices.includes(index)) return;
    audioService.playClick();
    setUsedIndices((prev) => [...prev, index]);
    setState((prev) => ({ ...prev, input: [...prev.input, char] }));
    if (state.mode === GameMode.WORD_LINK && !isTracing) setIsTracing(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isTracing || state.isCorrect !== null) return;
    
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;
    
    const tileElement = element.closest('[data-tile-index]');
    if (tileElement) {
      const idx = parseInt(tileElement.getAttribute('data-tile-index') || '-1', 10);
      if (idx !== -1 && !usedIndices.includes(idx)) {
        const char = state.scrambled[idx];
        handleLetterClick(char, idx);
      }
    }
  };

  const handleInputTileClick = (index: number) => {
    if (state.isCorrect !== null || state.mode === GameMode.WORD_LINK) return;
    const newUsedIndices = [...usedIndices];
    newUsedIndices.splice(index, 1);
    const newInput = [...state.input];
    newInput.splice(index, 1);
    setUsedIndices(newUsedIndices);
    setState((prev) => ({ ...prev, input: newInput }));
    audioService.playClick();
  };

  const submitWord = () => {
    if (state.isCorrect !== null) return;
    if (state.input.join('') === state.currentWord) {
      audioService.playCorrect();
      const baseBonus = state.mode === GameMode.RIDDLE ? 60 : state.mode === GameMode.WORD_LINK ? 50 : 25;
      let coinGain = Math.round(baseBonus * (1 + state.level * 0.05) * state.combo);
      if (state.mode === GameMode.TIMED) coinGain += Math.floor(state.timeLeft / 2);
      
      setLastReward(coinGain);
      const newScore = state.score + coinGain;
      const levelKey = `${state.genre}_${state.mode}`;
      const nextLvl = state.mode !== GameMode.TIMED ? state.level + 1 : state.level;

      setState((prev) => ({
        ...prev,
        score: newScore,
        combo: prev.combo + 1,
        isCorrect: true,
        playedWords: [...prev.playedWords, state.currentWord],
        timeLeft: prev.mode === GameMode.TIMED ? prev.timeLeft + 10 : prev.timeLeft,
        domainLevels: state.mode !== GameMode.TIMED ? { ...prev.domainLevels, [levelKey]: nextLvl } : prev.domainLevels
      }));
      
      if (state.mode === GameMode.WORD_LINK) {
        setShowCongratulations(true);
      } else {
        setTimeout(nextLevel, 1400);
      }
    } else {
      audioService.playWrong();
      setState((prev) => ({ ...prev, combo: 1, isCorrect: false }));
      setTimeout(() => {
        setState((prev) => ({ ...prev, isCorrect: null, input: [] }));
        setUsedIndices([]);
        setIsTracing(false);
      }, 600);
    }
  };

  const nextLevel = () => {
    setShowCongratulations(false);
    const nextLvl = state.mode !== GameMode.TIMED ? state.level + 1 : state.level;
    if (nextLvl > 100 && state.mode !== GameMode.TIMED) {
      setState(prev => ({ ...prev, status: 'DOMAIN_MASTERED' }));
      return;
    }
    const isSpecial = state.mode === GameMode.RIDDLE || state.mode === GameMode.WORD_LINK;
    const result = getNewWord(nextLvl, state.genre, state.playedWords, isSpecial);
    if (!result) {
      setState(prev => ({ ...prev, status: 'DOMAIN_MASTERED' }));
      return;
    }
    const { word, clue, scrambled, difficulty } = result;
    setState((prev) => ({
      ...prev,
      level: nextLvl,
      currentWord: word,
      currentClue: clue,
      difficulty,
      scrambled,
      input: [],
      isCorrect: null,
      status: isSpecial ? 'RIDDLE_PLAYING' : 'PLAYING',
    }));
    setUsedIndices([]);
    setIsTracing(false);
    audioService.playLevelUp();
  };

  const handleHint = () => {
    if (state.score < 50 || state.isCorrect !== null) return;
    audioService.playHint();
    const nextNeeded = state.currentWord[state.input.length];
    const sIdx = state.scrambled.findIndex((c, idx) => c === nextNeeded && !usedIndices.includes(idx));
    if (sIdx !== -1) {
      setUsedIndices(u => [...u, sIdx]);
      setState(p => ({ ...p, score: p.score - 50, input: [...p.input, nextNeeded] }));
    }
  };

  const renderProfileCreate = () => {
    const agents = Object.values(registry);
    return (
      <div className="flex flex-col items-center justify-center space-y-8 sm:space-y-12 animate-in fade-in zoom-in duration-700 mt-6 w-full max-w-2xl px-6 text-center">
        <div className="flex flex-col items-center gap-6">
          <GameLogo />
          <h1 className="text-xl sm:text-2xl font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-80">Access Terminal</h1>
        </div>
        
        <div className="w-full max-w-lg space-y-6">
          <form onSubmit={(e) => { e.preventDefault(); loginAgent(profileInput.trim().toUpperCase()); }} className="w-full space-y-4">
            <input type="text" value={profileInput} onChange={(e) => setProfileInput(e.target.value)} placeholder="ENTER AGENT IDENTIFIER" className="w-full bg-slate-900/60 backdrop-blur-xl border-2 border-slate-700 rounded-3xl py-5 px-8 text-white font-black text-xl text-center tracking-widest uppercase outline-none focus:border-indigo-500 shadow-inner" autoFocus />
            <button type="submit" disabled={profileInput.trim().length < 3} className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-black py-5 rounded-[2rem] text-xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 shadow-2xl">ESTABLISH CLEARANCE</button>
          </form>

          {agents.length > 0 && (
            <div className="w-full space-y-4 pt-4 text-left">
              <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] border-b border-slate-800/50 pb-2 pl-2">RETRIEVED PROFILES</h3>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {agents.map((agent: UserProfile) => (
                  <div key={agent.username} className="flex items-center gap-2 group">
                    <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl px-5 py-4 flex items-center justify-between transition-all group-hover:bg-slate-800/60 backdrop-blur-sm">
                      <button onClick={() => loginAgent(agent.username)} className="flex-1 flex flex-col items-start text-left">
                        <span className="text-white font-black text-lg">{agent.username}</span>
                        <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">WALLET: <span className="text-amber-400">${agent.score.toLocaleString()}</span></span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if (confirm(`DELETE AGENT ${agent.username}?`)) deleteAgent(agent.username); }}
                        className="ml-2 p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Agent"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMainMenu = () => {
    const user = registry[state.username];
    return (
      <div className="flex flex-col items-center justify-center space-y-8 sm:space-y-12 animate-in fade-in zoom-in duration-700 w-full max-w-4xl px-6 py-4">
        <div className="text-center flex flex-col items-center space-y-10">
          <GameLogo />
          
          <div className="flex flex-col items-center gap-4">
            <div className="text-indigo-300 font-black text-sm tracking-widest uppercase py-3 px-8 border border-indigo-500/20 rounded-2xl bg-indigo-500/5 backdrop-blur-xl">
              ACTIVE AGENT: <span className="text-white italic">{state.username}</span>
            </div>
            {user && (
              <div className="flex items-center gap-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-8 py-3 rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                <span className="text-3xl">🔥</span>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[11px] text-orange-400 font-black uppercase tracking-widest mb-1">Mission Streak</span>
                  <span className="text-2xl font-black text-white italic">{user.dailyStreak || 1} DAYS</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-md">
          <button onClick={() => setState((prev) => ({ ...prev, status: 'GENRE_SELECT' }))} className="w-full bg-white text-indigo-950 font-black py-7 sm:py-9 px-8 rounded-[2.5rem] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-2xl sm:text-4xl uppercase tracking-widest italic group overflow-hidden relative">
            <div className="absolute inset-0 bg-indigo-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10"></div>
            ENTER VAULT
          </button>
          <button onClick={handleLogout} className="w-full bg-rose-500/5 text-rose-400/60 font-black py-5 rounded-[1.5rem] border border-rose-500/10 hover:bg-rose-500/10 hover:text-rose-400 transition-all uppercase text-xs tracking-[0.3em] backdrop-blur-sm">ABORT MISSION / LOGOUT</button>
        </div>
      </div>
    );
  };

  const renderGenreSelect = () => {
    const genres = [
      { id: Genre.ANIMALS, icon: '🐾', color: 'from-orange-400 to-rose-500' },
      { id: Genre.SCIENCE, icon: '🔬', color: 'from-cyan-400 to-blue-600' },
      { id: Genre.DANCE, icon: '💃', color: 'from-rose-400 to-orange-500' },
      { id: Genre.SERIES, icon: '📺', color: 'from-red-600 to-slate-900' },
      { id: Genre.COSMETICS, icon: '💄', color: 'from-pink-300 to-rose-600' },
      { id: Genre.SPACE, icon: '🚀', color: 'from-indigo-500 to-purple-600' },
      { id: Genre.HISTORY, icon: '📜', color: 'from-stone-500 to-slate-700' },
      { id: Genre.MUSIC, icon: '🎹', color: 'from-fuchsia-500 to-indigo-800' },
      { id: Genre.TECH, icon: '💻', color: 'from-blue-500 to-cyan-500' },
      { id: Genre.NATURE, icon: '🌿', color: 'from-green-500 to-teal-500' },
      { id: Genre.FOOD, icon: '🍔', color: 'from-red-400 to-orange-500' },
      { id: Genre.CITIES, icon: '🏙️', color: 'from-gray-400 to-blue-400' },
      { id: Genre.SPORTS, icon: '⚽', color: 'from-blue-600 to-indigo-900' },
      { id: Genre.MOVIES, icon: '🎬', color: 'from-purple-800 to-pink-900' },
      { id: Genre.LITERATURE, icon: '📚', color: 'from-amber-600 to-orange-800' },
      { id: Genre.MYTHOLOGY, icon: '🔱', color: 'from-yellow-400 to-yellow-700' },
    ];
    return (
      <div className="flex flex-col items-center justify-center space-y-8 px-6 w-full max-w-6xl animate-in fade-in zoom-in duration-700">
        <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter italic text-center drop-shadow-2xl">SELECT SECTOR</h2>
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full">
          {genres.map((g) => {
            const rLvl = state.domainLevels[`${g.id}_${GameMode.RIDDLE}`] || 1;
            const wLvl = state.domainLevels[`${g.id}_${GameMode.WORD_LINK}`] || 1;
            const avgProgress = ((rLvl + wLvl - 2) / 198) * 100;
            return (
              <button key={g.id} onClick={() => selectGenre(g.id)} className="group relative p-6 pb-8 rounded-[2.5rem] bg-slate-900 border border-white/5 hover:border-white/20 transition-all transform hover:scale-105 active:scale-95 shadow-2xl overflow-hidden flex flex-col items-center backdrop-blur-md">
                <div className={`absolute inset-0 bg-gradient-to-br ${g.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{g.icon}</div>
                <div className="text-xs font-black text-white uppercase tracking-widest text-center">{g.id}</div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-5 overflow-hidden border border-white/5">
                  <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${Math.max(avgProgress, 2)}%` }}></div>
                </div>
                <div className="text-[7px] text-slate-500 font-black uppercase mt-3 tracking-tighter">CLEARANCE: {Math.round(avgProgress)}%</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => setState((prev) => ({ ...prev, status: 'MAIN_MENU' }))} className="text-slate-600 font-black text-xs uppercase tracking-[0.4em] hover:text-white transition-colors mt-8 py-4 px-8 border border-white/5 rounded-full hover:bg-white/5 backdrop-blur-md">BACK TO HUB</button>
      </div>
    );
  };

  const renderWordLinkBoard = () => {
    const tileCoords = state.scrambled.map((_, i) => {
      const angle = (i / state.scrambled.length) * 2 * Math.PI - Math.PI / 2;
      return { x: 50 + 35 * Math.cos(angle), y: 50 + 35 * Math.sin(angle) };
    });

    const isError = state.isCorrect === false;

    return (
      <div 
        className="relative w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] flex items-center justify-center select-none mt-4 touch-none"
        onPointerUp={() => { if(isTracing && state.input.length === state.currentWord.length) submitWord(); else { setIsTracing(false); setUsedIndices([]); setState(p=>({...p, input: []})); } }}
        onPointerMove={handlePointerMove}
      >
        <div className={`absolute inset-0 rounded-full border-4 transition-colors duration-300 ${isError ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/10 bg-emerald-500/5'} animate-pulse scale-110`}></div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
          <defs>
            <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isError ? "#f43f5e" : "#10b981"} />
              <stop offset="100%" stopColor={isError ? "#9f1239" : "#3b82f6"} />
            </linearGradient>
          </defs>
          {usedIndices.map((idx, i) => {
            if (i === 0) return null;
            const start = tileCoords[usedIndices[i-1]], end = tileCoords[idx];
            return <line key={`line-${i}`} x1={`${start.x}%`} y1={`${start.y}%`} x2={`${end.x}%`} y2={`${end.y}%`} stroke="url(#linkGradient)" strokeWidth="10" strokeLinecap="round" opacity="0.8" />;
          })}
        </svg>
        {state.scrambled.map((char, i) => {
          const { x, y } = tileCoords[i];
          return (
            <div key={`${state.currentWord}-${i}`} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${x}%`, top: `${y}%` }}
              onPointerDown={() => handleLetterClick(char, i)}
            >
              <LetterTile char={char} index={i} isSelected={usedIndices.includes(i)} onClick={() => {}} disabled={state.isCorrect === true} />
            </div>
          );
        })}
        <div className="absolute text-center flex flex-col items-center pointer-events-none z-20">
          <div className={`${isError ? 'text-rose-500 animate-shake' : 'text-emerald-400'} font-black text-[10px] uppercase tracking-[0.3em] mb-2 transition-colors duration-300`}>
            {isError ? 'SEQUENCE REJECTED' : 'LINK SEQUENCE'}
          </div>
          <div className={`${isError ? 'text-rose-400' : 'text-white'} font-black text-5xl sm:text-6xl italic tracking-tighter transition-colors duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`}>
            {state.input.join('') || '?'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center py-6 sm:py-12 relative overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      {state.username && (
        <button onClick={() => { setRenameInput(state.username); setShowSettings(true); }} className="fixed top-6 right-6 z-[60] p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      )}

      {showCongratulations && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border-4 border-emerald-500/50 p-10 rounded-[4rem] shadow-[0_0_120px_rgba(16,185,129,0.3)] text-center max-w-sm w-full animate-in zoom-in slide-in-from-bottom-12 duration-500">
            <div className="text-7xl mb-6">🏆</div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">MISSION COMPLETE</h2>
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-8 italic">CONNECTION SECURED</p>
            <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/5 shadow-inner">
               <span className="text-indigo-300 text-xs font-black uppercase block mb-2 tracking-widest opacity-60">RECOVERED ASSETS</span>
               <span className="text-5xl font-black text-white tabular-nums tracking-tighter">${lastReward}</span>
            </div>
            <button onClick={nextLevel} className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-6 rounded-2xl text-xl uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">NEXT SEQUENCE</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
            <h2 className="text-white font-black text-2xl uppercase mb-8 tracking-widest italic">CLEARANCE HUD</h2>
            <div className="space-y-4">
              <input type="text" value={renameInput} onChange={(e) => setRenameInput(e.target.value.toUpperCase())} className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl py-5 px-6 text-white font-black uppercase text-center outline-none focus:border-indigo-500 text-xl tracking-widest" />
              <button onClick={() => renameAgent(state.username, renameInput)} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg text-lg">REASSIGN TAG</button>
              <button onClick={() => { if (confirm(`DELETE AGENT ${state.username}?`)) deleteAgent(state.username); }} className="w-full bg-rose-950/30 text-rose-500 border border-rose-500/20 font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-rose-600 hover:text-white transition-all">WIPE PROFILE</button>
              <button onClick={() => setShowSettings(false)} className="w-full bg-slate-700/50 text-slate-300 font-black py-4 rounded-2xl uppercase tracking-widest text-xs">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {(state.status !== 'PROFILE_CREATE' && state.status !== 'MAIN_MENU') && (
        <button onClick={() => setState((prev) => ({ ...prev, status: state.status === 'START' ? 'GENRE_SELECT' : 'START' }))} className="fixed top-6 left-6 z-50 p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all shadow-2xl hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}

      <div className="relative z-10 w-full flex flex-col items-center px-4">
        {state.status === 'PROFILE_CREATE' && renderProfileCreate()}
        {state.status === 'MAIN_MENU' && renderMainMenu()}
        {state.status === 'GENRE_SELECT' && renderGenreSelect()}
        {state.status === 'START' && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-700 w-full max-w-4xl mt-4">
            <h1 className="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-500 to-indigo-700 font-outfit uppercase tracking-tighter leading-none text-center drop-shadow-2xl">{state.genre}<br />SECTOR</h1>
            <div className="grid grid-cols-1 gap-6 w-full max-w-lg px-4">
              {[GameMode.RIDDLE, GameMode.WORD_LINK, GameMode.TIMED].map(mode => {
                const lvl = mode !== GameMode.TIMED ? (state.domainLevels[`${state.genre}_${mode}`] || 1) : null;
                return (
                  <button key={mode} onClick={() => initGame(mode)} className={`group relative py-8 rounded-[3rem] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-2xl font-black uppercase tracking-widest italic overflow-hidden ${mode === GameMode.RIDDLE ? 'bg-gradient-to-br from-purple-700 to-fuchsia-900' : mode === GameMode.WORD_LINK ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    <span className="relative z-10">{mode.replace('_', ' ')}</span>
                    {lvl && <div className="text-[10px] opacity-60 mt-1 not-italic tracking-[0.2em]">RANK {lvl}/100</div>}
                    {!lvl && <div className="text-[10px] opacity-60 mt-1 not-italic tracking-[0.2em]">BLITZ PROTOCOL</div>}
                    <div className="absolute inset-0 bg-white/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(state.status === 'PLAYING' || state.status === 'RIDDLE_PLAYING') && (
          <div className="flex flex-col items-center w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-2 px-2">
            <ScorePanel username={state.username} score={state.score} level={state.level} combo={state.combo} timeLeft={state.timeLeft} mode={state.mode} difficulty={state.difficulty} />
            {(state.status === 'RIDDLE_PLAYING' || state.mode === GameMode.WORD_LINK) && (
              <div className="w-full bg-indigo-900/40 backdrop-blur-3xl p-8 sm:p-12 rounded-[3rem] border-2 border-purple-500/20 shadow-2xl text-center">
                <p className="text-2xl sm:text-4xl font-black text-white italic leading-tight drop-shadow-md">"{state.currentClue}"</p>
              </div>
            )}
            {state.mode !== GameMode.WORD_LINK && (
              <div className={`flex flex-wrap justify-center items-center gap-3 p-8 min-h-[10rem] w-full rounded-[4rem] border-4 transition-all duration-500 relative ${state.isCorrect === true ? 'bg-emerald-500/20 border-emerald-400 animate-success-glow' : state.isCorrect === false ? 'bg-rose-500/10 border-rose-400/50 animate-shake' : 'bg-slate-900/60 border-slate-800/80 shadow-inner'}`}>
                {state.input.map((char, i) => (
                  <div key={i} className={state.isCorrect === true ? 'animate-success-pop' : ''} style={{ animationDelay: `${i * 0.08}s` }}>
                    <LetterTile char={char} index={i} isSelected={false} onClick={() => handleInputTileClick(i)} variant="input" disabled={state.isCorrect === true} />
                  </div>
                ))}
                {state.input.length === 0 && <div className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px] opacity-40 text-center animate-pulse">awaiting input sequence</div>}
              </div>
            )}
            {state.mode === GameMode.WORD_LINK ? renderWordLinkBoard() : (
              <div className="flex flex-wrap justify-center gap-3 max-w-xl">
                {state.scrambled.map((char, i) => (
                  <div key={`${state.currentWord}-${i}`} className="animate-tile-reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                    <LetterTile char={char} index={i} isSelected={usedIndices.includes(i)} onClick={() => handleLetterClick(char, i)} disabled={state.isCorrect === true} />
                  </div>
                ))}
              </div>
            )}
            {state.mode !== GameMode.WORD_LINK && (
              <div className="grid grid-cols-4 gap-4 w-full max-w-lg px-2">
                <button onClick={handleHint} disabled={state.score < 50 || state.isCorrect === true} className="flex flex-col items-center justify-center p-5 bg-yellow-600/20 border border-yellow-600/30 rounded-[2.5rem] text-yellow-500 font-black hover:bg-yellow-600/30 transition-all disabled:opacity-20 shadow-xl"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg><span className="text-[9px] mt-1 uppercase tracking-widest">HINT</span></button>
                <button onClick={() => handleInputTileClick(state.input.length - 1)} disabled={state.input.length === 0 || state.isCorrect === true} className="flex flex-col items-center justify-center p-5 bg-slate-800/80 border border-slate-700/50 rounded-[2.5rem] text-slate-400 font-black hover:bg-slate-700 transition-all disabled:opacity-20 shadow-xl backdrop-blur-md"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg><span className="text-[9px] mt-1 uppercase tracking-widest">UNDO</span></button>
                <button onClick={() => { setUsedIndices([]); setState(p => ({ ...p, input: [] })); audioService.playClick(); }} disabled={state.input.length === 0 || state.isCorrect === true} className="flex flex-col items-center justify-center p-5 bg-rose-600/20 border border-rose-600/30 rounded-[2.5rem] text-rose-500 font-black hover:bg-rose-600/30 transition-all disabled:opacity-20 shadow-xl"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg><span className="text-[9px] mt-1 uppercase tracking-widest">CLEAR</span></button>
                <button onClick={submitWord} disabled={state.input.length !== state.currentWord.length || state.isCorrect === true} className="flex flex-col items-center justify-center p-5 bg-indigo-600 rounded-[2.5rem] font-black text-white uppercase italic shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:opacity-20 transition-all hover:bg-indigo-500"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6 9 17l-5-5"/></svg><span className="text-[9px] mt-1 uppercase tracking-widest">CHECK</span></button>
              </div>
            )}
          </div>
        )}

        {state.status === 'GAMEOVER' && (
          <div className="flex flex-col items-center justify-center space-y-12 mt-20 text-center px-4 animate-in fade-in zoom-in duration-500">
            <h2 className="text-8xl font-black text-rose-500 uppercase italic tracking-tighter drop-shadow-[0_0_30px_rgba(244,63,94,0.4)]">LOCKDOWN</h2>
            <div className="bg-slate-900 border-4 border-rose-500/20 p-16 rounded-[5rem] text-center shadow-2xl backdrop-blur-xl">
              <span className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs block mb-4">ASSETS RECOVERED</span>
              <span className="text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">${state.score.toLocaleString()}</span>
              <button onClick={() => setState((prev) => ({ ...prev, status: 'MAIN_MENU' }))} className="w-full mt-12 bg-white text-indigo-950 font-black py-7 px-14 rounded-[3rem] uppercase tracking-widest text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all italic">RETURN TO HQ</button>
            </div>
          </div>
        )}

        {state.status === 'DOMAIN_MASTERED' && (
          <div className="flex flex-col items-center justify-center space-y-12 mt-20 text-center px-4 animate-in fade-in zoom-in duration-1000">
            <h2 className="text-7xl sm:text-9xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-[0_0_50px_rgba(234,179,8,0.3)]">DOMINATED!</h2>
            <div className="bg-slate-900 border-4 border-yellow-500/50 p-16 sm:p-24 rounded-[5rem] shadow-2xl max-w-3xl w-full text-center backdrop-blur-xl">
              <p className="text-3xl sm:text-5xl font-black text-white mb-12 uppercase leading-tight tracking-tighter">THE <span className="text-yellow-400">{state.genre}</span> {state.mode.replace('_', ' ')} DATA IS FULLY COMPROMISED.</p>
              <button onClick={() => setState((prev) => ({ ...prev, status: 'START' }))} className="w-full bg-yellow-500 text-yellow-950 font-black py-8 rounded-[3.5rem] text-3xl uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all italic">SELECT NEW TARGET</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
