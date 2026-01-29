import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";

// Simple in-memory room management
// In a real app, use Redis or database
interface Player {
    id: string; // socket.id
    uid: string; // user id
    name: string;
}

interface Room {
    code: string;
    players: Player[];
    gameState: "waiting" | "playing" | "winner";
    turnIndex: number; // 0 or 1
    boardNumbers: number[]; // Shared sequence for fairness (optional, currently client generates)
}

const rooms = new Map<string, Room>();

export function setupSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        path: "/socket.io",
        cors: {
            origin: true, // Allow the client's origin dynamically (reflects request origin)
            credentials: true,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket: Socket) => {
        console.log("New client connected:", socket.id);

        socket.on("join_room", ({ roomCode, uid, name }: { roomCode: string; uid: string; name: string }) => {
            const code = roomCode.toUpperCase();
            let room = rooms.get(code);

            if (!room) {
                // Create room if it doesn't exist (though usually created via API first)
                room = {
                    code,
                    players: [],
                    gameState: "waiting",
                    turnIndex: 0,
                    boardNumbers: [],
                };
                rooms.set(code, room);
            }

            console.log(`[DEBUG] Join request: Code=${code}, UID=${uid}, Name=${name}`);

            // Check if already in room
            const existingPlayer = room.players.find((p) => p.uid === uid);
            if (existingPlayer) {
                console.log(`[DEBUG] Reconnecting existing player: ${uid}`);
                existingPlayer.id = socket.id;
            } else {
                if (room.players.length >= 2) {
                    console.log(`[DEBUG] Room full: ${code}`);
                    socket.emit("error", "Room is full");
                    return;
                }
                room.players.push({ id: socket.id, uid, name });
                console.log(`[DEBUG] Player added. Count: ${room.players.length}`);
            }

            socket.join(code);
            console.log(`User ${name} joined room ${code}`);

            // Notify everyone in room about updated player list
            io.to(code).emit("room_state", {
                players: room.players,
                gameState: room.gameState,
            });

            // Start game if 2 players
            console.log(`[DEBUG] Check Start: Players=${room.players.length}, State=${room.gameState}`);
            if (room.players.length === 2 && room.gameState === "waiting") {
                console.log(`[DEBUG] STARTING GAME for room ${code}`);
                room.gameState = "playing";
                room.turnIndex = 0; // First player starts
                io.to(code).emit("start_game", {
                    turnUid: room.players[0].uid,
                    players: room.players.map(p => ({ uid: p.uid, name: p.name }))
                });
            }
        });

        socket.on("click_cell", ({ roomCode, number, uid }: { roomCode: string; number: number; uid: string }) => {
            const code = roomCode.toUpperCase();
            const room = rooms.get(code);
            if (!room || room.gameState !== "playing") return;

            // Verify turn
            //  const currentPlayer = room.players[room.turnIndex];
            //  if (currentPlayer.uid !== uid) return; // Not your turn

            // Switch turn
            room.turnIndex = (room.turnIndex + 1) % 2;
            const nextPlayer = room.players[room.turnIndex];

            // Broadcast move
            io.to(code).emit("number_selected", {
                number,
                nextTurnUid: nextPlayer.uid
            });
        });

        // Handle manual turn switch (timeout)
        socket.on("switch_turn", ({ roomCode }: { roomCode: string }) => {
            const code = roomCode.toUpperCase();
            const room = rooms.get(code);
            if (!room || room.gameState !== "playing") return;

            room.turnIndex = (room.turnIndex + 1) % 2;
            const nextPlayer = room.players[room.turnIndex];

            io.to(code).emit("turn_switched", {
                nextTurnUid: nextPlayer.uid
            });
        });

        socket.on("claim_win", ({ roomCode, uid }: { roomCode: string; uid: string }) => {
            const code = roomCode.toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            room.gameState = "winner";
            io.to(code).emit("game_over", {
                winnerUid: uid
            });
        });

        socket.on("disconnect", () => {
            // Find which room the socket was in
            rooms.forEach((room, code) => {
                const index = room.players.findIndex((p) => p.id === socket.id);
                if (index !== -1) {
                    // Remove player
                    room.players.splice(index, 1);

                    if (room.players.length === 0) {
                        rooms.delete(code);
                    } else {
                        // Notify remaining player
                        room.gameState = "waiting"; // Reset to waiting if someone leaves? Or forfeit?
                        // For simplicity: notify specific event
                        io.to(code).emit("player_left", {
                            players: room.players
                        });
                    }
                }
            });
        });
    });
}
