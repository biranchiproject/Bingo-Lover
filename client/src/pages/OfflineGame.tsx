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

  const [bingoProgress, setBingoProgress] = useState<string[]>([]);
  const letters = ['B', 'I', 'N', 'G', 'O'];

  const startNewGame = () => {
    setBoard(generateBoard());
    setMarked(Array(5).fill(null).map(() => Array(5).fill(false)));
    setCalledNumbers([]);
    setCurrentNumber(null);
    setWinner(false);
    setBingoProgress([]);
    setGameState('playing');
  };

  const checkWinPatterns = (m: boolean[][]) => {
    let completedPatterns = 0;
    // Rows
    for (let i = 0; i < 5; i++) if (m[i].every(v => v)) completedPatterns++;
    // Cols
    for (let i = 0; i < 5; i++) if (m.every(r => r[i])) completedPatterns++;
    // Diagonals
    if (m.every((r, i) => r[i])) completedPatterns++;
    if (m.every((r, i) => r[4 - i])) completedPatterns++;
    
    const newProgress = letters.slice(0, completedPatterns);
    setBingoProgress(newProgress);
    return completedPatterns >= 5;
  };

  const handleCellClick = (ri: number, ci: number) => {
    if (gameState !== 'playing' || winner) return;
    
    const newMarked = marked.map(row => [...row]);
    newMarked[ri][ci] = !newMarked[ri][ci];
    setMarked(newMarked);

    if (checkWinPatterns(newMarked)) {
      setGameState('winner');
      setWinner(true);
      playWin();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-4 animate-neon-cycle overflow-hidden">
      <div className="page-border-glow" />
      
      {/* Falling Cubes Background */}
      <div className="falling-cubes-container">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="cube"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `${Math.random() * 5}s`,
              width: `${Math.random() * 30 + 10}px`,
              height: `${Math.random() * 30 + 10}px`,
            }}
          />
        ))}
      </div>
      
      <header className="flex flex-col items-center glass-panel p-4 rounded-xl mb-6 max-w-6xl mx-auto w-full gap-4 relative z-10 neon-border">
        <div className="flex items-center justify-between w-full">
          <button onClick={() => setLocation("/")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black tracking-tighter text-neon-blue uppercase">Offline Bingo</h1>
          <button onClick={startNewGame} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4">
          {letters.map((letter, i) => (
            <div 
              key={letter}
              className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 font-black text-2xl transition-all duration-500 ${
                bingoProgress.includes(letter) 
                  ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_20px_#00f3ff]' 
                  : 'border-white/20 text-white/20'
              }`}
            >
              {letter}
            </div>
          ))}
        </div>
      </header>

      {gameState === 'setup' ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white uppercase">Ready to Play?</h2>
            <p className="text-white/50">One unique board. 1-25 Range. Click to mark.</p>
          </div>
          <NeonButton onClick={startNewGame} className="text-xl px-12 py-8" glowColor="#ffee00">
            START GAME
          </NeonButton>
        </div>
      ) : (
        <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col items-center">
          {/* Single Board */}
          <div className="flex flex-col items-center space-y-4 w-full relative z-10">
            <div className="neon-border p-2 rounded-xl bg-black/40">
              <BingoBoard card={board} marked={marked} onCellClick={handleCellClick} disabled={winner} />
            </div>
          </div>

          {/* Winner overlay */}
          <AnimatePresence>
            {winner && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <div className="bg-neon-yellow text-black px-12 py-6 rounded-2xl font-black text-4xl shadow-[0_0_50px_#ffee00] border-4 border-white">
                  🎉 BINGO! YOU WIN 🎉
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Restart Button when finished */}
          {winner && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
              <NeonButton onClick={startNewGame} className="px-12 py-6 text-xl" glowColor="#ffee00">
                PLAY AGAIN
              </NeonButton>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
