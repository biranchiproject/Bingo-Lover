import { useEffect, useMemo, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";

type GameState = "waiting" | "playing" | "winner";
type Turn = "me" | "opponent";

const LETTERS = ["B", "I", "N", "G", "O"];

type Player = {
  uid: string;
  name: string;
  id: string; // socket id
}

export function useOnlineGame(roomCode: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [board, setBoard] = useState<number[][]>([]);
  const [marked, setMarked] = useState<boolean[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(false))
  );

  const [gameState, setGameState] = useState<GameState>("waiting");
  const [turn, setTurn] = useState<Turn>("me"); // Will be synced with server
  const [highlightNumber, setHighlightNumber] = useState<number | null>(null);
  const [bingoProgress, setBingoProgress] = useState<string[]>([]);
  const [timer, setTimer] = useState(10);
  const [players, setPlayers] = useState<Player[]>([]);

  const [showVs, setShowVs] = useState(false);
  const [vsCountdown, setVsCountdown] = useState(5);

  // Ensure we have a UID (fallback to random if missing from localStorage)
  // Ensure we have a UID (fallback to random if missing from localStorage)
  const { toast } = useToast();

  const [uid] = useState(() => {
    try {
      const userProfile = JSON.parse(localStorage.getItem("user_profile") || "{}");
      return userProfile.uid || `anon_${Math.random().toString(36).substr(2, 9)}`;
    } catch {
      return `anon_${Math.random().toString(36).substr(2, 9)}`;
    }
  });

  const [name] = useState(() => localStorage.getItem("bingo_name") || `Player ${uid.substring(0, 4)}`);

  // 🎲 Generate board locally (could be server synced for strictness but random is fine for now)
  useEffect(() => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(
      () => Math.random() - 0.5
    );
    const grid: number[][] = [];
    for (let i = 0; i < 5; i++) grid.push(nums.slice(i * 5, i * 5 + 5));
    setBoard(grid);
  }, []);

  // 🔌 Socket Connection
  useEffect(() => {
    if (!roomCode || !uid) return;

    // Force websocket transport and explicit localhost URL for dev reliability
    // Force websocket transport and explicit URL
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const s = io(apiUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    s.on("connect", () => {
      console.log("Connected to socket");
      s.emit("join_room", { roomCode, uid, name });
    });

    s.on("room_state", (state: { players: Player[], gameState: GameState }) => {
      console.log(`[CLIENT] Room State Update: ${state.gameState}, Players: ${state.players.length}`);
      setPlayers(state.players);
      setGameState(state.gameState); // Always sync state (allows reconnect to playing)
    });

    s.on("start_game", ({ turnUid, players }: { turnUid: string, players: Player[] }) => {
      if (players) setPlayers(players);

      // Start VS Screen sequence
      setShowVs(true);
      setVsCountdown(5);

      const interval = setInterval(() => {
        setVsCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowVs(false);
            setGameState("playing");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTurn(turnUid === uid ? "me" : "opponent");
    });

    s.on("number_selected", ({ number, nextTurnUid }: { number: number, nextTurnUid: string }) => {
      // If it was opponent's turn, we receive the number they selected
      // We need to find that number on our board and mark it interactively?
      // Actually requirements say: 
      // "Player 2 sees ONLY that number glowing on their board. Player 2 must manually click the same number."

      if (nextTurnUid === uid) {
        // It's becoming my turn, meaning opponent marked 'number'
        // So we highlight it for me to click
        setHighlightNumber(number);
        setTurn("opponent"); // Still opponent turn visually until I click? 
        // Wait, req says: "Player 2 must manually click the same number... Then Player 2 selects a new number."
        // So strictly speaking, it is still "opponent's action pending" on my side? 
        // or can we simplify? 
        // Let's follow strictly: 
        // "Player 2 sees ONLY that number glowing... Player 2 must manually click... Then Player 2 selects a new number."
        // So: 
        // My turn: I select X. 
        // Opponent sees X glowing. Opponent clicks X. 
        // Opponent selects Y.
        // I see Y glowing. I click Y.

        // This implies a "response" phase.
        // BUT simplicity: 
        // If I receive "number_selected" from opponent (X), 
        // it means they picked X. 
        // I see X highlight. 
        // when I click X, I mark it. 
        // THEN it becomes MY turn to pick a new number? 
        // Req: "Turn alternates like this." -> P1 picks -> P2 confirms -> P2 picks -> P1 confirms -> ...

        // Let's implement this state:
        // turn = "opponent" (waiting for them to pick)
        // they pick X.
        // I receive X.
        // turn = "opponent" ? No, turn is "me" but restricted to X?
        // Let's use `highlightNumber` as the restriction.
      } else {
        // I just picked, or turn switched elsewhere
      }

      // Actually let's refine based on "nextTurnUid". 
      // The server logic I wrote simply toggles ID. 
      // If P1 (uid1) clicks, server says next is P2 (uid2).
      // So P2 receives "nextTurnUid == me". 
      // P2 also receives "number". This number needs to be highlighted.
      // P2 MUST click this number.

      if (nextTurnUid === uid) {
        setHighlightNumber(number);
        // We set turn to "opponent" because I haven't clicked it yet? 
        // OR we set to "me" but restrict click? 
        // Reuse existing logic: 
        // "if (turn === 'opponent') { if (num !== highlightNumber) return; }"
        // So if I am P2, and it is "my turn to confirm", 
        // I should be in state "turn: opponent" with "highlightNumber: X".
        // When I click X, logic says:
        // "if (turn === 'me') { setHighlightNumber(num); setTurn('opponent'); }" -> This is for generating new number
        // Wait, the existing logic in OnlineGame.tsx was:
        // if turn==opponent & I click highlight:
        // mark it. THEN what?
        // The existing code didn't handle the "confirm then pick" flow fully. 
        // It just toggled.

        // Let's adjust to requirement:
        // P1 picks #17.
        // P2 sees #17 glowing. P2 MUST click #17.
        // After P2 clicks #17, P2 picks #25.
        // P1 sees #25 glowing. P1 MUST click #25.

        // So when P2 clicks #17 (the highlight), we shouldn't immediately send a number to server?
        // The server 'click_cell' event I wrote handles "switch turn".
        // I need to update server logic or client logic.
        // Client logic seems easier to adapt.

        // State: 
        // 1. My Turn To Pick: highlight=null, turn=me.
        // 2. Waiting for sync: highlight=X, turn=opponent. (Waiting for me to click X which opponent picked)
        // 3. Waiting for opponent to pick: highlight=null, turn=opponent.

        // Incoming "number_selected" (X) from opponent means -> State 2.
        setHighlightNumber(number);
        setTurn("opponent"); // effectively "confirming" mode
      }
    });

    s.on("game_over", ({ winnerUid }: { winnerUid: string }) => {
      setGameState("winner");
      // If I am winner
      if (winnerUid === uid) {
        // turn=me controls the "YOU WON" text in standard logic?
        // OnlineGame.tsx: {turn === "me" ? "YOU WON" : "YOU LOST"}
        setTurn("me");
        confetti();
      } else {
        setTurn("opponent");
      }
    });

    s.on("player_left", () => {
      toast({ title: "Opponent Disconnected", variant: "destructive" });
      setGameState("waiting");
      setBoard([]); // reset?
      setMarked(Array.from({ length: 5 }, () => Array(5).fill(false)));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    }
  }, [roomCode, uid, name]);


  // ⏱ Timer
  useEffect(() => {
    if (gameState !== "playing" || showVs) return;
    setTimer(10);
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          // Auto switch turn not fully implemented on client -> server handles it if needed
          // But visually updating:
          return 10;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [turn, gameState, showVs]);


  // 🧠 Win check
  const checkWin = (m: boolean[][]) => {
    let lines = 0;
    for (let i = 0; i < 5; i++) if (m[i].every(Boolean)) lines++;
    for (let i = 0; i < 5; i++) if (m.every((r) => r[i])) lines++;
    if (m.every((r, i) => r[i])) lines++;
    if (m.every((r, i) => r[4 - i])) lines++;

    setBingoProgress(LETTERS.slice(0, Math.min(lines, 5)));
    if (lines >= 5) {
      // Claim win
      socket?.emit("claim_win", { roomCode, uid });
    }
  };

  // 🎯 Click logic
  const onCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;
    if (marked[r][c]) return;

    const num = board[r][c];

    // CASE 1: Confirming opponent's move
    if (turn === "opponent") {
      if (num !== highlightNumber) return; // Must click highlighted

      // Mark it locally
      const copy = marked.map((row) => [...row]);
      copy[r][c] = true;
      setMarked(copy);
      checkWin(copy);

      // Now it becomes MY turn to pick
      setHighlightNumber(null);
      setTurn("me");
      return;
    }

    // CASE 2: My turn to pick
    if (turn === "me") {
      const copy = marked.map((row) => [...row]);
      copy[r][c] = true;
      setMarked(copy);
      checkWin(copy);

      // Send to server
      socket?.emit("click_cell", { roomCode, number: num, uid });

      // Now I wait for opponent to confirm AND pick
      setTurn("opponent");
      setHighlightNumber(null); // No highlight needed while waiting
    }
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

  // Confetti helper
  const confetti = () => {
    // Using the global confetti if available or import
    // For now assumes the parent component handles it or we import canvas-confetti
    // simpler to just let state drive it
  };


  return {
    board,
    marked,
    onCellClick,
    turn,
    timer,
    bingoProgress,
    remainingNumbers,
    gameState,
    highlightNumber,
    players,
    showVs,
    vsCountdown
  };
}
