import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGameSocket } from "@/hooks/use-game-socket";
import { useGameEngine } from "@/hooks/use-game-engine";
import { BingoBoard } from "@/components/BingoBoard";
import { NeonButton } from "@/components/NeonButton";
import { LastCalledNumbers } from "@/components/LastCalledNumbers";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Users, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import useSound from "use-sound";

export default function OnlineRoom() {
  const [match, params] = useRoute("/room/:code");
  const [_, setLocation] = useLocation();
  const roomCode = params?.code || null;
  const { uid, name, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Game Logic Hook (Client side validation + board state)
  const { card, marked, toggleCell, resetGame, isBingo, setCard, setMarked } = useGameEngine();
  
  // Socket Logic Hook
  const { isConnected, gameState, startGame, callBingo } = useGameSocket(roomCode, uid, name);

  // Sounds
  const [playNumber] = useSound('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3', { volume: 0.5 });
  const [playWin] = useSound('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');

  // Sync server state with local effects
  useEffect(() => {
    if (gameState?.currentNumber) {
      playNumber();
    }
    if (gameState?.status === 'waiting') {
      resetGame();
    }
    if (gameState?.winner) {
      playWin();
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }, [gameState?.currentNumber, gameState?.status, gameState?.winner, playNumber, playWin, resetGame]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode || "");
    toast({ title: "Copied!", description: "Room code copied to clipboard." });
  };

  const handleLeave = () => {
    setLocation("/");
  };

  // Redirect if not auth
  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 relative overflow-y-auto flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 -z-20" />
      <div className="fixed inset-0 aurora-gradient opacity-15 -z-10" />

      {/* Top Bar */}
      <header className="flex items-center justify-between max-w-6xl mx-auto w-full mb-6 glass-panel p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <button onClick={handleLeave} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase">Room Code</span>
            <div className="flex items-center gap-2 cursor-pointer group" onClick={copyCode}>
              <span className="text-xl font-bold font-mono tracking-wider text-neon-blue">{roomCode}</span>
              <Copy className="w-3 h-3 text-white/50 group-hover:text-white" />
            </div>
          </div>
        </div>

        {/* Current Number Display (Mini) */}
        {gameState?.status === 'playing' && (
          <div className="hidden md:flex items-center gap-4">
            <LastCalledNumbers numbers={gameState.numbersCalled} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
            <span className="text-xs font-bold">{gameState?.players.length || 0} Players</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col items-center">
        
        {/* Waiting Lobby */}
        {gameState?.status === 'waiting' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-center space-y-8 py-12"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white mb-2">WAITING FOR PLAYERS</h2>
              <p className="text-white/50">The host will start the game shortly.</p>
              
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                {gameState.players.map(p => (
                  <div key={p.uid} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center font-bold text-xs">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button (only usually host logic, but for simplicity any player can start in this demo) */}
            <NeonButton onClick={startGame} className="text-xl px-12 py-6" glowColor="#ffee00">
              START GAME
            </NeonButton>
          </motion.div>
        )}

        {/* Active Game */}
        {gameState?.status !== 'waiting' && (
          <div className="w-full space-y-6">
            
            {/* The Caller Display */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-neon-blue blur-2xl opacity-20 animate-pulse rounded-full" />
                <div className="w-24 h-24 rounded-full bg-black border-4 border-neon-blue flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(0,243,255,0.3)]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={gameState?.currentNumber || 'wait'}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="text-4xl font-black font-display text-white"
                    >
                      {gameState?.currentNumber || '...'}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              <div className="mt-4 md:hidden">
                <LastCalledNumbers numbers={gameState?.numbersCalled || []} />
              </div>
            </div>

            {/* Winner Announcement */}
            {gameState?.winner && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-neon-purple/20 border border-neon-purple p-6 rounded-xl text-center backdrop-blur-md mb-4"
              >
                <h3 className="text-2xl font-bold text-white mb-2">WINNER!</h3>
                <p className="text-neon-yellow text-xl font-bold">{gameState.winner} claimed BINGO!</p>
                <NeonButton onClick={startGame} className="mt-4" variant="ghost">Play Again</NeonButton>
              </motion.div>
            )}

            {/* The Board */}
            <BingoBoard 
              card={card}
              marked={marked}
              onCellClick={toggleCell}
              disabled={gameState?.status === 'finished'}
            />

            {/* Actions */}
            <div className="flex justify-center pt-4 pb-8">
              <NeonButton 
                onClick={callBingo} 
                className="w-full max-w-sm text-2xl py-8 font-black tracking-widest"
                glowColor={isBingo ? "#ffee00" : undefined}
                disabled={!isBingo || gameState?.status === 'finished'}
              >
                {gameState?.status === 'finished' ? 'GAME OVER' : 'BINGO!'}
              </NeonButton>
            </div>
          </div>
        )}
      </main>

      {/* Voice Chat Stub */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button className="w-12 h-12 rounded-full bg-black/80 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-md">
          <MicOff className="w-5 h-5 text-red-400" />
        </button>
      </div>
    </div>
  );
}
