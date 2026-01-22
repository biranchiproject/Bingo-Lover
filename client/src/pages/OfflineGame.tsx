import { useState, useEffect } from "react";
import { BingoBoard } from "@/components/BingoBoard";
import { NeonButton } from "@/components/NeonButton";
import { LastCalledNumbers } from "@/components/LastCalledNumbers";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCcw, Play } from "lucide-react";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import useSound from "use-sound";

export default function OfflineGame() {
  const [_, setLocation] = useLocation();
  
  // Game State for single player
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'winner'>('setup');
  const [board, setBoard] = useState<number[][]>([]);
  const [marked, setMarked] = useState<boolean[][]>(Array(5).fill(null).map(() => Array(5).fill(false)));
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [winner, setWinner] = useState<boolean>(false);

  // Sounds
  const [playNumber] = useSound('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3', { volume: 0.5 });
  const [playWin] = useSound('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');

  function generateBoard(): number[][] {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const board: number[][] = [];
    for (let i = 0; i < 5; i++) {
      board.push(nums.slice(i * 5, i * 5 + 5));
    }
    return board;
  }

  const startNewGame = () => {
    setBoard(generateBoard());
    setMarked(Array(5).fill(null).map(() => Array(5).fill(false)));
    setCalledNumbers([]);
    setCurrentNumber(null);
    setWinner(false);
    setGameState('playing');
  };

  const callNextNumber = () => {
    if (calledNumbers.length >= 25 || winner) return;
    
    const remaining = Array.from({ length: 25 }, (_, i) => i + 1).filter(n => !calledNumbers.includes(n));
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    
    const newHistory = [next, ...calledNumbers];
    setCalledNumbers(newHistory);
    setCurrentNumber(next);
    playNumber();

    // Auto mark
    const newMarked = marked.map(row => [...row]);
    board.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell === next) newMarked[ri][ci] = true;
      });
    });
    setMarked(newMarked);

    // Check Win
    const checkWin = (m: boolean[][]) => {
      // Rows
      for (let i = 0; i < 5; i++) if (m[i].every(v => v)) return true;
      // Cols
      for (let i = 0; i < 5; i++) if (m.every(r => r[i])) return true;
      // Diagonals
      if (m.every((r, i) => r[i])) return true;
      if (m.every((r, i) => r[4 - i])) return true;
      return false;
    };

    if (checkWin(newMarked)) {
      setGameState('winner');
      setWinner(true);
      playWin();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-4">
      <div className="fixed inset-0 aurora-gradient opacity-20 -z-10" />
      
      <header className="flex items-center justify-between glass-panel p-4 rounded-xl mb-6 max-w-6xl mx-auto w-full">
        <button onClick={() => setLocation("/")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-black tracking-tighter text-neon-blue uppercase">Offline Bingo</h1>
        <button onClick={startNewGame} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <RefreshCcw className="w-5 h-5" />
        </button>
      </header>

      {gameState === 'setup' ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white uppercase">Ready to Play?</h2>
            <p className="text-white/50">One unique board. 1-25 Range.</p>
          </div>
          <NeonButton onClick={startNewGame} className="text-xl px-12 py-8" glowColor="#ffee00">
            START GAME
          </NeonButton>
        </div>
      ) : (
        <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col items-center">
          {/* Single Board */}
          <div className="flex flex-col items-center space-y-4 w-full">
            <div className="text-center py-2 px-6 bg-neon-blue/20 border border-neon-blue rounded-full">
              <span className="font-black text-neon-blue uppercase">Your Board</span>
            </div>
            <BingoBoard card={board} marked={marked} onCellClick={() => {}} disabled />
          </div>

          {/* Controls overlay */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4 z-50">
            <AnimatePresence mode="wait">
              {winner ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-neon-yellow text-black px-8 py-4 rounded-xl font-black text-2xl shadow-[0_0_30px_#ffee00]">
                  🎉 BINGO! YOU WIN 🎉
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-black border-4 border-neon-blue flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                    <span className="text-3xl font-black">{currentNumber || '??'}</span>
                  </div>
                  <NeonButton onClick={callNextNumber} className="px-12 py-6 text-xl">
                    NEXT NUMBER
                  </NeonButton>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      )}
    </div>
  );
}
