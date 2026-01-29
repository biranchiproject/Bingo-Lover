import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { NeonButton } from "@/components/NeonButton";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Gamepad2, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { name, register, isAuthenticated, uid } = useAuth();
  const [inputName, setInputName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [onlineOpen, setOnlineOpen] = useState(false);
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim().length < 2) return;
    register(inputName);
  };

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      if (!uid) { // Should not happen if button is shown only when authenticated
        throw new Error("User not found");
      }
      const res = await apiRequest("POST", api.rooms.create.path, {
        hostId: uid,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLocation(`/room/${data.code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", api.rooms.join.path, {
        code,
        uid: uid || "anon",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLocation(`/room/${data.code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "YOU HAVE ENTER WRONG CODE", // Specific validation message requested
        variant: "destructive",
      });
    },
  });

  const joinRoom = () => {
    if (roomCodeInput.length < 4) return;
    joinRoomMutation.mutate(roomCodeInput.toUpperCase());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 aurora-gradient opacity-40 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* LOGO */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-6xl md:text-8xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink tracking-tighter"
            animate={{
              textShadow: [
                "0 0 10px rgba(0,243,255,0.5)",
                "0 0 20px rgba(188,19,254,0.6)",
                "0 0 10px rgba(0,243,255,0.5)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            BINGO
          </motion.h1>
        </div>

        {!isAuthenticated ? (
          /* REGISTER */
          <motion.form
            onSubmit={handleRegister}
            className="glass-panel p-8 rounded-2xl space-y-6"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <motion.h2
              className="text-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"
              animate={{
                textShadow: [
                  "0 0 12px rgba(0,243,255,0.8)",
                  "0 0 22px rgba(188,19,254,0.8)",
                  "0 0 12px rgba(0,243,255,0.8)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              Enter your name ?
            </motion.h2>

            <Input
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="PLAYER NAME"
              maxLength={12}
              className="bg-black/50 border-white/10 h-12 text-center text-lg text-white placeholder:text-white/20 uppercase"
            />

            <NeonButton
              type="submit"
              className="w-full"
              disabled={inputName.length < 2}
            >
              LETS PLAY GAME
            </NeonButton>
          </motion.form>
        ) : (
          /* DASHBOARD */
          <motion.div
            className="glass-panel p-8 rounded-2xl space-y-6"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <div className="text-center">
              <p className="text-xs text-white/40 uppercase">
                Welcome back
              </p>
              <h2 className="text-3xl font-bold neon-text">{name}</h2>
            </div>

            {/* OFFLINE */}
            <NeonButton
              onClick={() => setLocation("/offline")}
              className="w-full flex items-center justify-center gap-2"
              variant="secondary"
            >
              <Gamepad2 className="w-5 h-5" />
              Offline Mode
            </NeonButton>

            <div className="h-px bg-white/10 my-4" />

            {/* ONLINE */}
            <NeonButton
              onClick={() => setOnlineOpen((p) => !p)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Globe className="w-5 h-5" />
              Online Mode
            </NeonButton>

            {/* ONLINE OPTIONS */}
            <AnimatePresence>
              {onlineOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* CREATE ROOM */}
                  <NeonButton
                    onClick={() => createRoomMutation.mutate()}
                    disabled={createRoomMutation.isPending}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Globe className="w-5 h-5" />
                    {createRoomMutation.isPending
                      ? "Creating..."
                      : "Create Room"}
                  </NeonButton>

                  {/* JOIN ROOM – UPDATED NEON STYLE */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="ROOM CODE"
                      value={roomCodeInput}
                      onChange={(e) =>
                        setRoomCodeInput(e.target.value.toUpperCase())
                      }
                      maxLength={6}
                      className="
                        bg-black/60
                        border-2 border-neon-blue
                        text-neon-blue
                        text-center
                        font-mono
                        uppercase
                        tracking-widest
                        placeholder:text-neon-blue/40
                        shadow-[0_0_12px_#00f3ff]
                        focus:shadow-[0_0_18px_#00f3ff]
                        focus:border-neon-blue
                      "
                    />

                    <NeonButton
                      onClick={joinRoom}
                      disabled={roomCodeInput.length < 4}
                      className="px-4"
                    >
                      JOIN
                    </NeonButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <NeonButton
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full mt-6"
              variant="danger"
            >
              Log out
            </NeonButton>
          </motion.div>
        )}
      </motion.div>

      {/* FOOTER */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/10 text-xs font-mono">
        © Biranchi Creativity ❤️
      </div>
    </div>
  );
}
