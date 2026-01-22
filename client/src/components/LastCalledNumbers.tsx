import { motion, AnimatePresence } from 'framer-motion';

export function LastCalledNumbers({ numbers }: { numbers: number[] }) {
  // Take last 5
  const displayNumbers = numbers.slice(-5).reverse();

  return (
    <div className="flex items-center gap-2 overflow-hidden py-2 px-4 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm">
      <span className="text-xs text-muted-foreground uppercase tracking-wider mr-2">History</span>
      <div className="flex gap-2">
        <AnimatePresence initial={false}>
          {displayNumbers.map((num, i) => (
            <motion.div
              key={`${num}-${i}`}
              initial={{ width: 0, opacity: 0, scale: 0 }}
              animate={{ width: 'auto', opacity: 1 - (i * 0.2), scale: 1 - (i * 0.1) }}
              exit={{ width: 0, opacity: 0, scale: 0 }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 text-sm font-mono font-bold text-white"
            >
              {num}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
