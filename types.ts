
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum GameMode {
  TIMED = 'TIMED',
  RIDDLE = 'RIDDLE',
  WORD_LINK = 'WORD_LINK'
}

export enum Genre {
  ANIMALS = 'ANIMALS',
  SPACE = 'SPACE',
  NATURE = 'NATURE',
  FOOD = 'FOOD',
  TECH = 'TECH',
  CITIES = 'CITIES',
  SPORTS = 'SPORTS',
  MOVIES = 'MOVIES',
  SCIENCE = 'SCIENCE',
  LITERATURE = 'LITERATURE',
  MYTHOLOGY = 'MYTHOLOGY',
  HISTORY = 'HISTORY',
  MUSIC = 'MUSIC',
  DANCE = 'DANCE',
  SERIES = 'SERIES',
  ART = 'ART',
  COSMETICS = 'COSMETICS'
}

export interface GameState {
  username: string;
  score: number;
  level: number;
  domainLevels: Record<string, number>; // Key format: GENRE_MODE (e.g. ANIMALS_RIDDLE)
  combo: number;
  timeLeft: number;
  currentWord: string; 
  currentClue?: string;
  difficulty: Difficulty;
  genre: Genre;
  scrambled: string[];
  input: string[];
  isCorrect: boolean | null;
  status: 'PROFILE_CREATE' | 'MAIN_MENU' | 'START' | 'GENRE_SELECT' | 'PLAYING' | 'GAMEOVER' | 'LEVEL_UP' | 'RIDDLE_PLAYING' | 'CEREMONY' | 'DOMAIN_MASTERED';
  mode: GameMode;
  playedWords: string[];
}

export interface WordEntry {
  word: string;
  clue?: string;
  difficulty: Difficulty;
  genre: Genre;
}
