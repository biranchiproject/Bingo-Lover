import { db } from "./db";
import { users, rooms, type User, type InsertUser, type Room, type InsertRoom } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(uid: string, points: number, wins: number): Promise<User>;

  // Rooms
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(code: string): Promise<Room | undefined>;
  updateRoomStatus(code: string, status: string, currentNumber?: number, numbersCalled?: number[], winnerId?: string): Promise<Room>;
}

export class DatabaseStorage implements IStorage {
  async getUser(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check if user exists first to update name if needed, or insert
    const existing = await this.getUser(insertUser.uid);
    if (existing) {
      const [updated] = await db.update(users)
        .set({ name: insertUser.name })
        .where(eq(users.uid, insertUser.uid))
        .returning();
      return updated;
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPoints(uid: string, points: number, wins: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ points, wins })
      .where(eq(users.uid, uid))
      .returning();
    return user;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values(insertRoom).returning();
    return room;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async updateRoomStatus(code: string, status: string, currentNumber?: number, numbersCalled?: number[], winnerId?: string): Promise<Room> {
    const updates: any = { status };
    if (currentNumber !== undefined) updates.currentNumber = currentNumber;
    if (numbersCalled !== undefined) updates.numbersCalled = numbersCalled;
    if (winnerId !== undefined) updates.winnerId = winnerId;

    const [room] = await db.update(rooms)
      .set(updates)
      .where(eq(rooms.code, code))
      .returning();
    return room;
  }
}

export const storage = new DatabaseStorage();
