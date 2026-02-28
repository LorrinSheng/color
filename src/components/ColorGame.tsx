import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Clock, Trophy, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface ColorState {
  baseColor: string;
  diffColor: string;
  diffIndex: number;
  delta: number; // 0-100 scale of difference
}

interface GameStats {
  score: number;
  startTime: number;
  endTime: number;
  level: number;
}

export const ColorGame: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [colorState, setColorState] = useState<ColorState | null>(null);
  const [stats, setStats] = useState<GameStats>({ score: 0, startTime: 0, endTime: 0, level: 1 });
  const [timeLeft, setTimeLeft] = useState(45); // Harder: 45 seconds start
  const [gridSize, setGridSize] = useState(5); 

  // Generate random color and variation
  const generateLevel = useCallback((level: number) => {
    // Difficulty curve: Delta decreases faster and starts lower
    // Level 1: Delta ~15, Level 10: Delta ~7, Level 20: Delta ~2
    const baseDelta = Math.max(1, 15 - level * 0.8); 
    
    // Increase grid size every 5 levels, max 9x9
    const newGridSize = Math.min(9, Math.floor(5 + (level - 1) / 5));
    setGridSize(newGridSize);

    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 40) + 60; // 60-100%
    const lightness = Math.floor(Math.random() * 40) + 30; // 30-70%

    const baseColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // Vary lightness for the target
    const isLighter = Math.random() > 0.5;
    const lDiff = isLighter ? baseDelta : -baseDelta;
    const diffColor = `hsl(${hue}, ${saturation}%, ${Math.min(100, Math.max(0, lightness + lDiff))}%)`;

    const diffIndex = Math.floor(Math.random() * (gridSize * gridSize));

    setColorState({
      baseColor,
      diffColor,
      diffIndex,
      delta: baseDelta
    });
  }, [gridSize]);

  // Start Game
  const startGame = () => {
    setStats({ score: 0, startTime: Date.now(), endTime: 0, level: 1 });
    setTimeLeft(45);
    setGameState('playing');
    generateLevel(1);
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const endGame = () => {
    setGameState('gameover');
    setStats(prev => ({ ...prev, endTime: Date.now() }));
  };

  const handleBlockClick = (index: number) => {
    if (gameState !== 'playing' || !colorState) return;

    if (index === colorState.diffIndex) {
      // Correct!
      const newLevel = stats.level + 1;
      setStats(prev => ({ ...prev, score: prev.score + 1, level: newLevel }));
      // Add a small time bonus? Optional. Let's keep it strict 60s for now, or maybe +1s
      setTimeLeft(prev => Math.min(60, prev + 1)); 
      generateLevel(newLevel);
    } else {
      // Wrong! Penalty?
      // Harder penalty
      setTimeLeft(prev => Math.max(0, prev - 5)); // -5 seconds penalty
      
      // Visual feedback for wrong click could be added here
      const el = document.getElementById(`block-${index}`);
      if (el) {
        el.classList.add('animate-shake');
        setTimeout(() => el.classList.remove('animate-shake'), 500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col items-center justify-center p-4">
      
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            Chroma Challenge
          </h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Color Sensitivity Test</p>
        </div>
        {gameState === 'playing' && (
          <div className="flex items-center gap-4 text-sm font-mono">
            <div className="flex items-center gap-1 text-yellow-500">
              <Clock size={16} />
              <span className={`font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : ''}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="flex items-center gap-1 text-cyan-500">
              <Trophy size={16} />
              <span className="font-bold">{stats.score}</span>
            </div>
          </div>
        )}
      </header>

      {/* Game Area */}
      <main className="w-full max-w-md aspect-square relative">
        <AnimatePresence mode="wait">
          
          {gameState === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-8 text-center"
            >
              <div className="w-24 h-24 grid grid-cols-2 gap-2 mb-6 rotate-12">
                <div className="bg-pink-500 rounded-lg"></div>
                <div className="bg-purple-500 rounded-lg"></div>
                <div className="bg-indigo-500 rounded-lg"></div>
                <div className="bg-blue-500 rounded-lg"></div>
              </div>
              <h2 className="text-3xl font-bold mb-4">Ready to test your eyes?</h2>
              <p className="text-zinc-400 mb-8">Find the block with the slightly different color. The difference gets smaller as you progress.</p>
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-white/10"
              >
                <Play size={20} fill="currentColor" />
                START CHALLENGE
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && colorState && (
            <motion.div 
              key="grid"
              className="w-full h-full grid gap-2 p-2 bg-zinc-900 rounded-2xl border border-white/5"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {Array.from({ length: gridSize * gridSize }).map((_, i) => (
                <button
                  key={i}
                  id={`block-${i}`}
                  onClick={() => handleBlockClick(i)}
                  className="w-full h-full rounded-lg transition-transform active:scale-95 hover:brightness-110 shadow-sm"
                  style={{ 
                    backgroundColor: i === colorState.diffIndex ? colorState.diffColor : colorState.baseColor 
                  }}
                />
              ))}
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md rounded-3xl border border-white/10 p-8 text-center z-10"
            >
              <h2 className="text-4xl font-bold mb-2">Time's Up!</h2>
              <div className="text-6xl font-bold bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent mb-6">
                {stats.score}
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-white/5 p-4 rounded-2xl">
                  <div className="text-xs text-zinc-500 uppercase">Level Reached</div>
                  <div className="text-xl font-mono">{stats.level}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl">
                  <div className="text-xs text-zinc-500 uppercase">Avg Time/Pick</div>
                  <div className="text-xl font-mono">
                    {stats.score > 0 ? ((60 - timeLeft) / stats.score).toFixed(1) : '-'}s
                  </div>
                </div>
              </div>

              {/* Color Analysis */}
              {colorState && (
                <div className="w-full bg-black/20 p-4 rounded-2xl mb-8 border border-white/5">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-lg shadow-lg" style={{ backgroundColor: colorState.baseColor }}></div>
                    <div className="text-zinc-500">vs</div>
                    <div className="w-12 h-12 rounded-lg shadow-lg ring-2 ring-white/50" style={{ backgroundColor: colorState.diffColor }}></div>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Final Difficulty Delta: <span className="text-white font-mono">{colorState.delta.toFixed(1)}%</span>
                  </p>
                </div>
              )}

              <button 
                onClick={startGame}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                TRY AGAIN
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer / Instructions */}
      <footer className="mt-8 text-center text-zinc-500 text-sm max-w-xs">
        <p className="flex items-center justify-center gap-2">
          <Info size={14} />
          <span>Pick the odd color out.</span>
        </p>
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};
