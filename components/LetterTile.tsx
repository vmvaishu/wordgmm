
import React from 'react';
import { audioService } from '../services/audioService';

interface LetterTileProps {
  char: string;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'scrambled' | 'input';
}

const LetterTile: React.FC<LetterTileProps> = ({ char, index, isSelected, onClick, disabled, variant = 'scrambled' }) => {
  const handleClick = () => {
    if (disabled || isSelected) return;
    audioService.playClick();
    onClick();
  };

  const baseStyles = "w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center text-xl sm:text-2xl md:text-4xl font-black rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 select-none shadow-lg md:shadow-xl transform active:scale-90 relative overflow-hidden";
  
  const stateStyles = isSelected 
    ? "bg-slate-800 text-slate-600 scale-90 opacity-30 cursor-default border-none shadow-none" 
    : variant === 'input' 
      ? "bg-indigo-600 text-white hover:bg-indigo-500 border-b-2 sm:border-b-4 border-indigo-800 active:border-b-0"
      : "bg-white text-slate-900 hover:bg-slate-50 border-b-2 sm:border-b-4 border-slate-300 active:border-b-0 active:translate-y-1";

  return (
    <div 
      onClick={handleClick}
      data-tile-index={index}
      className={`${baseStyles} ${stateStyles} ${disabled ? 'pointer-events-none' : ''}`}
    >
      {!isSelected && (
        <div className="absolute top-0 left-0 w-full h-[1px] sm:h-[2px] bg-white/20 pointer-events-none"></div>
      )}
      {char}
    </div>
  );
};

export default LetterTile;
