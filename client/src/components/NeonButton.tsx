import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  glowColor?: string;
}

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = 'primary', glowColor, children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-transparent border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)]",
      secondary: "bg-transparent border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white shadow-[0_0_15px_rgba(188,19,254,0.3)] hover:shadow-[0_0_25px_rgba(188,19,254,0.6)]",
      danger: "bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]",
      ghost: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-300",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-transparent",
          variants[variant],
          className
        )}
        style={glowColor ? {
          borderColor: glowColor,
          color: glowColor,
          boxShadow: `0 0 15px ${glowColor}40`
        } : undefined}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
NeonButton.displayName = 'NeonButton';
