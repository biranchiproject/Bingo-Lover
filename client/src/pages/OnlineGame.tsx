
import { useMemo, useEffect, useRef } from "react";
import { BingoBoard } from "@/components/BingoBoard";
import { NeonButton } from "@/components/NeonButton";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useOnlineGame } from "@/hooks/useOnlineGame"; // Using real hook
import { useToast } from "@/hooks/use-toast";

export default function OnlineGame() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/room/:code");
  const roomCode = params?.code || "";
  const { toast } = useToast();

  // Audio Refs
  const winAudioRef = useRef<HTMLAudioElement>(null);
  const loseAudioRef = useRef<HTMLAudioElement>(null);
  const tapAudioRef = useRef<HTMLAudioElement>(null);

  const {
    board,
    marked,
    onCellClick: originalOnCellClick,
    turn,
    timer,
    bingoProgress,
    remainingNumbers,
    gameState,
    highlightNumber,
    players,
    showVs,
    vsCountdown
  } = useOnlineGame(roomCode);

  // Wrap onCellClick to play sound
  const onCellClick = (r: number, c: number) => {
    // Play sound if valid click (basic check)
    if (turn === "me" || (!highlightNumber && turn === "opponent")) {
      tapAudioRef.current?.play().catch(() => { });
    }
    originalOnCellClick(r, c);
  };

  // Play Win/Lose Sound
  useEffect(() => {
    if (gameState === "winner") {
      if (turn === "me") {
        winAudioRef.current?.play().catch(() => { });
      } else {
        loseAudioRef.current?.play().catch(() => { });
      }
    }
  }, [gameState, turn]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({ title: "Copied!", description: "Room code copied to clipboard" });
  };

  return (
    <div className="min-h-[100svh] bg-black text-white flex justify-center items-center overflow-hidden">
      <style>{`
        @keyframes hue-cycle {
          0% { filter: hue-rotate(0deg) drop-shadow(0 0 2px rgba(0, 255, 255, 0.8)); }
          50% { filter: hue-rotate(180deg) drop-shadow(0 0 10px rgba(255, 0, 255, 0.8)); }
          100% { filter: hue-rotate(360deg) drop-shadow(0 0 2px rgba(0, 255, 255, 0.8)); }
        }
        .neon-hue-cycle {
          animation: hue-cycle 5s linear infinite;
          background: linear-gradient(to right, #00f, #f0f, #0ff);
          -webkit-background-clip: text;
          color: transparent;
        }
      `}</style>
      <div className="page-border-glow" />

      {/* SOUNDS */}
      <audio ref={winAudioRef} src="/music/victory.mp3" />
      <audio ref={loseAudioRef} src="/music/game-over.mp3" />
      <audio ref={tapAudioRef} src="/music/tap.mp3" />

      {/* VS SCREEN OVERLAY */}
      <AnimatePresence>
        {showVs && players.length === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 gap-12"
          >
            {/* 1. TOP: Countdown */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-neon-blue flex items-center justify-center text-5xl font-black text-white shadow-[0_0_30px_#00f3ff] animate-pulse">
                {vsCountdown}
              </div>
            </div>

            {/* 2. MIDDLE: Players and VS */}
            <div className="flex items-center justify-center w-full max-w-4xl gap-2 md:gap-16">
              {/* Player 1 (Left) */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="text-right flex-1"
              >
                <div className="text-xl md:text-5xl font-black text-neon-pink uppercase drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] break-all line-clamp-1">
                  {players[0]?.name || "PLAYER 1"}
                </div>
              </motion.div>

              {/* VS (Center) */}
              <div className="text-5xl md:text-8xl font-black italic neon-hue-cycle p-2 md:p-4">
                VS
              </div>

              {/* Player 2 (Right) */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="text-left flex-1"
              >
                <div className="text-xl md:text-5xl font-black text-neon-blue uppercase drop-shadow-[0_0_15px_rgba(0,243,255,0.8)] break-all line-clamp-1">
                  {players[1]?.name || "PLAYER 2"}
                </div>
              </motion.div>
            </div>

            {/* 3. BOTTOM: Get Ready */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-neon-yellow font-bold text-2xl tracking-widest animate-pulse mt-8"
            >
              GET READY TO PLAY
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[420px] flex flex-col items-center px-3 py-4 gap-5">
        {/* HEADER */}
        {gameState !== "waiting" && !showVs && (
          <div className="w-full neon-border glass-panel p-4 rounded-xl flex items-center justify-between">
            <button onClick={() => setLocation("/")}>
              <ArrowLeft />
            </button>

            <div className="text-center">
              <div className="text-neon-blue font-black text-xl">
                ✨ LETS PLAY HAVE FUN✨
              </div>
              <div className="text-neon-yellow text-xs flex items-center justify-center gap-2 cursor-pointer" onClick={copyCode}>
                ROOM : {roomCode} <Copy className="w-3 h-3" />
              </div>
            </div>

            <div className="text-xs opacity-60 font-bold">
              {timer > 0 ? (turn === "me" ? "YOUR TURN" : "OPPONENT") : "TIMEOUT"}
            </div>
          </div>
        )}


        {/* BOARD OR WAITING SCREEN */}
        <div className="relative w-full">
          {gameState === "waiting" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center space-y-6"
            >
              {/* Text moved inside card */}
              <div
                className="neon-border glass-panel p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 w-full aspect-square relative"
                onClick={copyCode}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setLocation("/"); }}
                  className="absolute top-4 left-4 text-white/50 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="text-xl font-bold text-center neon-hue-cycle">
                  SHARE THE ROOM CODE TO PLAY THE GAME❤️
                </div>

                <div className="text-xs text-white/40 uppercase tracking-widest mt-4">
                  Room Code
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                  {roomCode}
                </div>

                <div className="text-sm text-center text-white/50 animate-pulse mt-4">
                  Waiting for opponent to join...
                </div>
              </div>
            </motion.div>
          ) : (
            !showVs && (
              <motion.div
                className={`neon-border rounded-2xl p-4 w-full aspect-square`}
              >
                <BingoBoard
                  card={board}
                  marked={marked}
                  onCellClick={onCellClick}
                  highlightNumber={highlightNumber}
                  disabled={turn === "opponent" && !highlightNumber}
                />
              </motion.div>
            )
          )}
        </div>

        {/* BINGO PROGRESS */}
        {gameState !== "waiting" && (
          <div className="mt-6 flex justify-center gap-5">
            {["B", "I", "N", "G", "O"].map((l) => (
              <div
                key={l}
                className={`w-14 h-14 flex items-center justify-center text-2xl font-black rounded-xl border-4 neon-letter-glow
                ${bingoProgress.includes(l)
                    ? "bg-neon-yellow text-black shadow-[0_0_40px_#ffee00]"
                    : "text-neon-blue opacity-40"
                  }`}
              >
                {l}
              </div>
            ))}
          </div>
        )}

        {/* GAME INFO */}
        <div className="mt-4 text-center text-sm text-white/50 min-h-[20px]">
          {turn === "opponent" && highlightNumber && (
            <span className="text-neon-pink animate-pulse">OPPONENT SELECTED {highlightNumber}. CLICK IT!</span>
          )}
        </div>

      </div>

      {/* WIN / LOSE */}
      <AnimatePresence>
        {gameState === "winner" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-black border-4 win-dialog-border p-8 rounded-2xl text-center space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              <div className="text-3xl md:text-4xl font-black win-text-glow leading-tight break-words px-2 uppercase">
                <span className="text-neon-yellow">
                  {localStorage.getItem("bingo_name") || "PLAYER"}
                </span>
                <br />
                {turn === "me" ? "YOU WON 🎉" : "YOU LOST 😥"}
              </div>

              <div className="text-sm text-white/70">
                Remaining Numbers ({remainingNumbers.length})
              </div>

              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {remainingNumbers.map((n) => (
                  <span
                    key={n}
                    className="px-3 py-1 bg-black border border-neon-yellow text-neon-yellow rounded-md shadow-[0_0_10px_#ffee00]"
                  >
                    {n}
                  </span>
                ))}
              </div>

              <NeonButton onClick={() => setLocation("/")}>
                EXIT ROOM
              </NeonButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <div className="absolute bottom-3 w-full text-center text-xs text-white/40">
        © Biranchi Creativity • All Rights Reserved
      </div>
    </div>
  );
}
