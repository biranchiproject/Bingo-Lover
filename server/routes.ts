import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
    const uid = req.params.uid as string;
    const user = await storage.getUser(uid);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.post(api.rooms.create.path, async (req, res) => {
    console.log("Received create room request", req.body);
    // Simple random numeric code generator
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated code:", code);
    await storage.createRoom({ code, hostId: req.body.hostId });
    res.status(201).json({ code });
  });

  app.post(api.rooms.join.path, async (req, res) => {
    const { code } = api.rooms.join.input.parse(req.body);
    const room = await storage.getRoom(code);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ code: room.code });
  });



  return httpServer;
}
