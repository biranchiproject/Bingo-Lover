import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { NeonButton } from "@/components/NeonButton";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Gamepad2, Globe, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const { name, register, isAuthenticated } = useAuth();
  const [inputName, setInputName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim().length < 2) return;
    register(inputName);
  };

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.rooms.create.path, { hostId: useAuth().uid });
      return res.json();
    },
    onSuccess: (data) => {
      setLocation(`/room/${data.code}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create room", variant: "destructive" });
    }
  });

  const joinRoom = () => {
    if (!roomCodeInput) return;
    setLocation(`/room/${roomCodeInput.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 aurora-gradient opacity-40 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <motion.h1 
            className="text-6xl md:text-8xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink tracking-tighter filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            animate={{ 
              textShadow: [
                "0 0 10px rgba(0,243,255,0.5)",
                "0 0 20px rgba(188,19,254,0.5)",
                "0 0 10px rgba(0,243,255,0.5)"
              ] 
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            BINGO
          </motion.h1>
          <p className="text-neon-blue/80 font-mono tracking-widest uppercase text-sm">Neon Edition</p>
        </div>

        {!isAuthenticated ? (
          <motion.form 
            onSubmit={handleRegister}
            className="glass-panel p-8 rounded-2xl space-y-6"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Who are you?</h2>
              <p className="text-muted-foreground text-sm">Enter your codename to enter the grid.</p>
            </div>
            
            <Input
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="PLAYER NAME"
              className="bg-black/50 border-white/10 h-12 text-center text-lg text-white placeholder:text-white/20 focus:border-neon-blue transition-colors font-display uppercase"
              maxLength={12}
            />

            <NeonButton 
              type="submit" 
              className="w-full"
              disabled={inputName.length < 2}
            >
              Enter Grid
            </NeonButton>
          </motion.form>
        ) : (
          <motion.div 
            className="glass-panel p-8 rounded-2xl space-y-6"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm uppercase">Welcome back</p>
              <h2 className="text-3xl font-bold text-white neon-text">{name}</h2>
            </div>

            <div className="space-y-3">
              <NeonButton 
                onClick={() => setLocation('/offline')} 
                className="w-full flex items-center justify-center gap-2"
                variant="secondary"
              >
                <Gamepad2 className="w-5 h-5" />
                Offline Mode
              </NeonButton>
              
              <div className="h-px bg-white/10 my-4" />

              <NeonButton 
                onClick={() => createRoomMutation.mutate()} 
                className="w-full flex items-center justify-center gap-2"
                disabled={createRoomMutation.isPending}
              >
                <Globe className="w-5 h-5" />
                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
              </NeonButton>

              <div className="flex gap-2">
                <Input 
                  placeholder="ROOM CODE" 
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="bg-black/50 border-white/10 text-center font-mono uppercase tracking-widest"
                  maxLength={6}
                />
                <NeonButton 
                  onClick={joinRoom} 
                  disabled={roomCodeInput.length < 4}
                  className="px-4"
                  variant="ghost"
                >
                  Join
                </NeonButton>
              </div>
            </div>

            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="w-full text-xs text-muted-foreground hover:text-white mt-4"
            >
              Log out
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Footer Decoration */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/10 text-xs font-mono">
        SYSTEM READY // V.2.0.4
      </div>
    </div>
  );
}
