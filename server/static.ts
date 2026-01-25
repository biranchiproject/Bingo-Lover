import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 ROOT dist (not server/public)
const clientDistPath = path.resolve(__dirname, "../../dist");

export function serveStatic(app: Express) {
  if (!fs.existsSync(clientDistPath)) {
    console.error("❌ Client build not found at:", clientDistPath);
    return;
  }

  app.use(express.static(clientDistPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}
