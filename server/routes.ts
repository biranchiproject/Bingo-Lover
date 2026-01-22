import type { Express } from "express";
import type { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { WS_EVENTS, type GameState } from "@shared/schema";

// Generate a random 4 letter room code
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Bingo Number Logic
function generateBingoNumber(calledNumbers: number[]): number | null {
  if (calledNumbers.length >= 75) return null;
  let num;
  do {
    num = Math.floor(Math.random() * 75) + 1;
  } while (calledNumbers.includes(num));
  return num;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // REST API
  app.post(api.users.createOrUpdate.path, async (req, res) => {
    try {
      const input = api.users.createOrUpdate.input.parse(req.body);
      const user = await storage.createUser(input);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUser(req.params.uid);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.post(api.rooms.create.path, async (req, res) => {
    const { hostId } = req.body;
    const code = generateRoomCode();
    await storage.createRoom({ code, hostId });
    res.status(201).json({ code });
  });

  app.post(api.rooms.join.path, async (req, res) => {
    const { code } = req.body;
    const room = await storage.getRoom(code);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  // Socket.IO Server
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // In-memory game state
  const activeRooms = new Map<string, {
    gameState: GameState;
    timer?: NodeJS.Timeout;
  }>();

  io.on('connection', (socket) => {
    const { roomCode, uid, name } = socket.handshake.query;

    if (roomCode && typeof roomCode === 'string' && uid && typeof uid === 'string' && name && typeof name === 'string') {
      
      socket.join(roomCode);

      // Initialize room state if not exists
      if (!activeRooms.has(roomCode)) {
        activeRooms.set(roomCode, {
          gameState: {
            roomCode,
            status: 'waiting',
            players: [],
            currentNumber: null,
            numbersCalled: [],
            winner: null
          }
        });
      }

      const room = activeRooms.get(roomCode)!;
      
      // Add player if not present
      if (!room.gameState.players.find(p => p.uid === uid)) {
        room.gameState.players.push({ uid, name, ready: true });
      }

      // Broadcast join event with updated state
      io.to(roomCode).emit(WS_EVENTS.JOIN_ROOM, room.gameState);

      // Handle Events
      socket.on(WS_EVENTS.START_GAME, () => {
        if (room.gameState.status !== 'playing') {
          room.gameState.status = 'playing';
          room.gameState.numbersCalled = [];
          
          io.to(roomCode).emit(WS_EVENTS.START_GAME, room.gameState);

          // Start loop
          if (room.timer) clearInterval(room.timer);
          room.timer = setInterval(() => {
            const num = generateBingoNumber(room.gameState.numbersCalled);
            if (num === null) {
              clearInterval(room.timer);
              return;
            }
            
            room.gameState.currentNumber = num;
            room.gameState.numbersCalled.push(num);

            io.to(roomCode).emit(WS_EVENTS.NUMBER_CALLED, { 
              state: room.gameState, 
              number: num 
            });
          }, 4000);
        }
      });

      socket.on(WS_EVENTS.BINGO_CLAIMED, ({ uid }: { uid: string }) => {
        const player = room.gameState.players.find(p => p.uid === uid);
        if (player) {
          room.gameState.status = 'finished';
          room.gameState.winner = player.name;
          if (room.timer) clearInterval(room.timer);
          
          io.to(roomCode).emit(WS_EVENTS.GAME_OVER, { winner: player.name });
        }
      });

      socket.on(WS_EVENTS.SIGNAL, (payload) => {
        // Broadcast signal to others in room (excluding sender)
        socket.to(roomCode).emit(WS_EVENTS.SIGNAL, payload);
      });

      socket.on('disconnect', () => {
        room.gameState.players = room.gameState.players.filter(p => p.uid !== uid);
        if (room.gameState.players.length === 0) {
          if (room.timer) clearInterval(room.timer);
          activeRooms.delete(roomCode);
        } else {
          io.to(roomCode).emit(WS_EVENTS.LEAVE_ROOM, room.gameState);
        }
      });
    }
  });

  return httpServer;
}
