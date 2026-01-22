import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

interface BingoBoardProps {
  card: (number | null)[][];
  marked: boolean[][];
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  winningPattern?: {r: number, c: number}[];
}

export function BingoBoard({ card, marked, onCellClick, disabled, winningPattern }: BingoBoardProps) {
  return (
    <div className="relative p-1 rounded-2xl bg-gradient-to-br from-neon-blue/20 via-neon-purple/20 to-neon-yellow/20 animate-pulse-slow">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl rounded-2xl -z-10" />
      
      {/* Header Letters */}
      <div className="grid grid-cols-5 mb-2 text-center">
        {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
          <div key={letter} className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-display">
            {letter}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2 md:gap-3 p-2 md:p-4 bg-black/40 rounded-xl border border-white/10">
        {card.map((row, rIndex) => (
          row.map((num, cIndex) => {
            const isCenter = rIndex === 2 && cIndex === 2;
            const isMarked = marked[rIndex][cIndex] || isCenter;
            
            return (
              <motion.button
                key={`${rIndex}-${cIndex}`}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                onClick={() => !disabled && onCellClick(rIndex, cIndex)}
                className={cn(
                  "bingo-cell aspect-square flex items-center justify-center text-lg sm:text-2xl md:text-3xl font-bold rounded-lg transition-all duration-300",
                  isMarked 
                    ? "bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.4)]" 
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30",
                  "border-2",
                  disabled && "cursor-not-allowed opacity-80"
                )}
              >
                <AnimatePresence mode="wait">
                  {isCenter ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ type: "spring" }}
                    >
                      <Star className="w-6 h-6 md:w-8 md:h-8 text-neon-yellow fill-neon-yellow animate-pulse" />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="num"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(isMarked && "text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]")}
                    >
                      {num}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {/* Selection Ring Animation */}
                {isMarked && (
                  <motion.div
                    layoutId={`ring-${rIndex}-${cIndex}`}
                    className="absolute inset-0 border-2 border-neon-purple rounded-lg"
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            );
          })
        ))}
      </div>
    </div>
  );
}
