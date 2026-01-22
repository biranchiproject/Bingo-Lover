import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_EVENTS, type GameState } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useGameSocket(roomCode: string | null, uid: string | null, name: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!roomCode || !uid || !name) return;

    // Connect to same host
    const socket = io(window.location.origin, {
      query: { uid, name, roomCode },
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket');
      socket.emit(WS_EVENTS.JOIN_ROOM, { roomCode, uid, name });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket');
    });

    // Game Events
    socket.on(WS_EVENTS.JOIN_ROOM, (state: GameState) => {
      setGameState(state);
    });

    socket.on(WS_EVENTS.LEAVE_ROOM, (state: GameState) => {
      setGameState(state);
    });
    
    socket.on(WS_EVENTS.START_GAME, (state: GameState) => {
      setGameState(state);
      toast({
        title: "GAME STARTED!",
        description: "Good luck! Eyes on the board!",
        className: "bg-neon-purple text-white border-none",
      });
    });

    socket.on(WS_EVENTS.NUMBER_CALLED, (data: { state: GameState, number: number }) => {
      setGameState(data.state);
      // Optional: Sound effect for new number handled in component
    });

    socket.on(WS_EVENTS.GAME_OVER, (data: { winner: string }) => {
      toast({
        title: "BINGO!",
        description: `${data.winner} has won the game!`,
        variant: "destructive", // Using destructive for high contrast attention, or custom
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, uid, name, toast]);

  const startGame = () => {
    socketRef.current?.emit(WS_EVENTS.START_GAME, { roomCode });
  };

  const callBingo = () => {
    socketRef.current?.emit(WS_EVENTS.BINGO_CLAIMED, { roomCode, uid });
  };
  
  // For WebRTC signaling
  const sendSignal = (payload: any) => {
    socketRef.current?.emit(WS_EVENTS.SIGNAL, payload);
  };

  return {
    socket: socketRef.current,
    isConnected,
    gameState,
    startGame,
    callBingo,
    sendSignal
  };
}
