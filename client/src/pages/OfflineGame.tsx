import { useEffect, useMemo, useState, useRef } from "react";
import { BingoBoard } from "@/components/BingoBoard";
import { NeonButton } from "@/components/NeonButton";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";

type GameState = "playing" | "winner";

const LETTERS = ["B", "I", "N", "G", "O"];

export default function OfflineGame() {
  const [, setLocation] = useLocation();
  const playerName =
    (localStorage.getItem("bingo_name") || "PLAYER").toUpperCase();

  const victoryAudioRef = useRef<HTMLAudioElement>(null);

  const [gameState, setGameState] = useState<GameState>("playing");
  const [board, setBoard] = useState<number[][]>([]);
  const [marked, setMarked] = useState<boolean[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(false))
  );
  const [bingoProgress, setBingoProgress] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  const generateBoard = () => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(
      () => Math.random() - 0.5
    );
    const grid: number[][] = [];
    for (let i = 0; i < 5; i++) grid.push(nums.slice(i * 5, i * 5 + 5));
    setBoard(grid);
  };

  useEffect(() => {
    generateBoard();
  }, []);

  const checkWin = (m: boolean[][]) => {
    let lines = 0;
    for (let i = 0; i < 5; i++) if (m[i].every(Boolean)) lines++;
    for (let i = 0; i < 5; i++) if (m.every((r) => r[i])) lines++;
    if (m.every((r, i) => r[i])) lines++;
    if (m.every((r, i) => r[4 - i])) lines++;

    setBingoProgress(LETTERS.slice(0, Math.min(lines, 5)));

    if (lines >= 5) {
      setGameState("winner");
      victoryAudioRef.current?.play().catch(() => { });
      confetti({ particleCount: 220, spread: 90, origin: { y: 0.6 } });
    }
  };

  const onCellClick = (r: number, c: number) => {
    if (gameState === "winner") return;
    if (marked[r][c]) return;

    const copy = marked.map((row) => [...row]);
    copy[r][c] = true;
    setMarked(copy);
    setHasStarted(true);
    checkWin(copy);
  };

  const remainingNumbers = useMemo(() => {
    const rem: number[] = [];
    board.forEach((row, r) =>
      row.forEach((num, c) => {
        if (!marked[r]?.[c]) rem.push(num);
      })
    );
    return rem;
  }, [board, marked]);

  const restartGame = () => {
    if (hasStarted && gameState !== "winner") return;
    setMarked(Array.from({ length: 5 }, () => Array(5).fill(false)));
    setBingoProgress([]);
    setGameState("playing");
    setHasStarted(false);
    generateBoard();
  };

  return (
    <div className="min-h-[100svh] bg-black text-white flex justify-center overflow-hidden">
      <div className="page-border-glow" />

      {/* RESPONSIVE FRAME */}
      <div className="w-full max-w-[420px] flex flex-col items-center px-3 py-4 gap-5">

        {/* HEADER */}
        <div className="w-full neon-border glass-panel p-4 rounded-xl flex items-center justify-between">
          <button onClick={() => setLocation("/")}>
            <ArrowLeft />
          </button>

          <div className="text-center">
            <div className="font-black text-lg neon-text">
              ✨ LETS PLAY HAVE FUN ✨
            </div>
            <div className="text-neon-yellow text-xs">{playerName}</div>
          </div>

          <button
            onClick={restartGame}
            disabled={hasStarted && gameState !== "winner"}
          >
            <RefreshCcw />
          </button>
        </div>

        {/* BOARD */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="neon-border rounded-2xl p-4 w-full aspect-square"
        >
          <BingoBoard
            card={board}
            marked={marked}
            onCellClick={onCellClick}
            disabled={gameState === "winner"}
          />
        </motion.div>

        {/* BINGO LETTERS */}
        <div className="flex justify-center gap-3">
          {LETTERS.map((l) => (
            <div
              key={l}
              className={`w-14 h-14 flex items-center justify-center text-2xl font-black rounded-xl border-4 neon-letter-glow
                ${bingoProgress.includes(l)
                  ? "bg-neon-yellow text-black shadow-[0_0_40px_#ffee00]"
                  : "text-neon-blue opacity-50"
                }`}
            >
              {l}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-auto py-3 w-full text-center text-xs text-white/40">
          © Biranchi Creativity • All Rights Reserved
        </div>

      </div>

      {/* WIN OVERLAY */}
      <AnimatePresence>
        {gameState === "winner" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-black border-4 win-dialog-border p-8 rounded-2xl text-center space-y-5">
              <div className="text-4xl font-black win-text-glow">
                🎉 {playerName} WON 🎉
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


              <NeonButton onClick={restartGame}>
                RESTART GAME
              </NeonButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={victoryAudioRef}>
        <source src="/music/victory.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}
