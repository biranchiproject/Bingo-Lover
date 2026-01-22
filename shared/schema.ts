import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profile (persisted)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Client-generated or server-generated unique ID
  name: text("name").notNull(),
  points: integer("points").default(0),
  wins: integer("wins").default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  uid: true,
  name: true,
});

// Rooms for online play
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: text("host_id").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, playing, finished
  currentNumber: integer("current_number"), // Last number called
  numbersCalled: jsonb("numbers_called").$type<number[]>().default([]),
  winnerId: text("winner_id"),
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  code: true,
  hostId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

// WebSocket Message Types
export const WS_EVENTS = {
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  START_GAME: 'start_game',
  NUMBER_CALLED: 'number_called',
  BINGO_CLAIMED: 'bingo_claimed',
  GAME_OVER: 'game_over',
  
  // WebRTC Signaling
  SIGNAL: 'signal', // offer, answer, ice-candidate
} as const;

export type GameState = {
  roomCode: string;
  status: 'waiting' | 'playing' | 'finished';
  players: { uid: string; name: string; ready: boolean }[];
  currentNumber: number | null;
  numbersCalled: number[];
  winner: string | null;
};
