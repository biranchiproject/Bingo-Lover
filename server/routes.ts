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
    const user = await storage.getUser(req.params.uid);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  return httpServer;
}
