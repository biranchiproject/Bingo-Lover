import { useState } from "react";
import { useLocation } from "wouter";
import { BingoBoard } from "@/components/BingoBoard";
import { NeonButton } from "@/components/NeonButton";
import { useGameEngine } from "@/hooks/use-game-engine";
import { ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSound from "use-sound";
import confetti from "canvas-confetti";

export default function OfflineGame() {
  const [_, setLocation] = useLocation();
  
  // Two players
  const p1 = useGameEngine();
  const p2 = useGameEngine();
  
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [gameActive, setGameActive] = useState(false);
  
  const [playCall] = useSound('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3', { volume: 0.5 });

  const startGame = () => {
    p1.resetGame();
    p2.resetGame();
    setCalledNumbers([]);
    setCurrentNumber(null);
    setGameActive(true);
  };

  const callNumber = () => {
    if (!gameActive) return;
    
    // Find a number that hasn't been called
    let num;
    do {
      num = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(num) && calledNumbers.length < 75);

    if (calledNumbers.length >= 75) return;

    playCall();
    setCurrentNumber(num);
    setCalledNumbers(prev => [...prev, num]);
  };

  // Win effect
  if (p1.isBingo || p2.isBingo) {
    if (gameActive) {
      setGameActive(false);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f3ff', '#ff00ff', '#ffee00']
      });
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 relative overflow-y-auto">
      {/* Background */}
      <div className="fixed inset-0 aurora-gradient opacity-20 -z-10" />

      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <button 
          onClick={() => setLocation("/")}
          className="flex items-center text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2" /> Exit
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-neon-blue">OFFLINE DUEL</h1>
        </div>
        <button 
          onClick={startGame}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Game Control Center */}
      <div className="flex flex-col items-center justify-center mb-8 sticky top-4 z-50">
        <div className="relative group">
           <div className="absolute inset-0 bg-neon-purple blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
           <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-black border-4 border-white/10 flex items-center justify-center relative backdrop-blur-md">
             <AnimatePresence mode="wait">
               <motion.div
                 key={currentNumber || "start"}
                 initial={{ scale: 0.5, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 1.5, opacity: 0 }}
                 className="text-4xl md:text-6xl font-black font-mono text-white"
               >
                 {currentNumber || "?"}
               </motion.div>
             </AnimatePresence>
           </div>
        </div>
        
        <NeonButton 
          onClick={gameActive ? callNumber : startGame}
          className="mt-6 min-w-[200px]"
          variant={gameActive ? "primary" : "secondary"}
        >
          {gameActive ? "CALL NEXT NUMBER" : "START NEW GAME"}
        </NeonButton>
      </div>

      {/* Boards Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
        {/* Player 1 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-xl font-bold text-neon-blue">PLAYER 1</h2>
            {p1.isBingo && <Trophy className="text-yellow-400 animate-bounce" />}
          </div>
          <BingoBoard 
            card={p1.card}
            marked={p1.marked}
            onCellClick={p1.toggleCell}
            disabled={!gameActive && !p1.isBingo}
          />
          {p1.isBingo && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-center text-6xl font-black text-neon-yellow animate-pulse"
            >
              BINGO!
            </motion.div>
          )}
        </div>

        {/* Player 2 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-xl font-bold text-neon-pink">PLAYER 2</h2>
            {p2.isBingo && <Trophy className="text-yellow-400 animate-bounce" />}
          </div>
          <BingoBoard 
            card={p2.card}
            marked={p2.marked}
            onCellClick={p2.toggleCell}
            disabled={!gameActive && !p2.isBingo}
          />
          {p2.isBingo && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-center text-6xl font-black text-neon-yellow animate-pulse"
            >
              BINGO!
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
