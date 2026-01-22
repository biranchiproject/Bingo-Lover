import { useState, useCallback, useEffect } from 'react';
import useSound from 'use-sound';

// Helper to generate a Bingo card
export const generateBingoCard = () => {
  const card: (number | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null));
  const ranges = [
    [1, 15],   // B
    [16, 30],  // I
    [31, 45],  // N
    [46, 60],  // G
    [61, 75]   // O
  ];

  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const nums = new Set<number>();
    while (nums.size < 5) {
      nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    const sortedNums = Array.from(nums); // Usually columns aren't sorted in Bingo but it helps readability
    // Standard US Bingo doesn't strictly require sorted columns, but often done.
    // Let's shuffle them for true randomness within the column constraints
    // Actually, usually they are random within the column.
    
    for (let row = 0; row < 5; row++) {
      card[row][col] = sortedNums[row];
    }
  }
  
  // Free space
  card[2][2] = null; 
  return card;
};

// Check for win condition
export const checkWin = (card: (number | null)[][], marked: boolean[][]) => {
  const size = 5;
  let winningCells: {r: number, c: number}[] = [];

  // Rows
  for (let r = 0; r < size; r++) {
    if (marked[r].every((m, c) => m || (r === 2 && c === 2))) {
      // Row win
      // Add cells to winning set
      // Return true
      return true;
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    let colWin = true;
    for (let r = 0; r < size; r++) {
      if (!marked[r][c] && !(r === 2 && c === 2)) {
        colWin = false;
        break;
      }
    }
    if (colWin) return true;
  }

  // Diagonal 1 (TL to BR)
  let d1Win = true;
  for (let i = 0; i < size; i++) {
    if (!marked[i][i] && !(i === 2 && i === 2)) {
      d1Win = false;
      break;
    }
  }
  if (d1Win) return true;

  // Diagonal 2 (TR to BL)
  let d2Win = true;
  for (let i = 0; i < size; i++) {
    if (!marked[i][size - 1 - i] && !(i === 2 && size - 1 - i === 2)) {
      d2Win = false;
      break;
    }
  }
  if (d2Win) return true;

  return false;
};

export function useGameEngine(initialCard?: (number | null)[][]) {
  const [card, setCard] = useState<(number | null)[][]>(initialCard || generateBingoCard());
  const [marked, setMarked] = useState<boolean[][]>(
    Array(5).fill(null).map((_, r) => Array(5).fill(r === 2 ? true : false)) // Center is auto-marked conceptually
  );
  // Actually, let's treat center specially in UI, mark array just tracks user clicks
  
  // Sounds
  // Using generic placeholders - normally these would be imported assets
  const [playClick] = useSound('https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3', { volume: 0.5 });
  const [playWin] = useSound('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3', { volume: 0.7 });

  const resetGame = useCallback(() => {
    setCard(generateBingoCard());
    setMarked(Array(5).fill(null).map((_, r) => Array(5).fill(false))); // Reset marks
  }, []);

  const toggleCell = useCallback((row: number, col: number) => {
    if (row === 2 && col === 2) return; // Free space
    
    playClick();
    setMarked(prev => {
      const newMarked = prev.map(r => [...r]);
      newMarked[row][col] = !newMarked[row][col];
      return newMarked;
    });
  }, [playClick]);

  const isBingo = checkWin(card, marked);

  useEffect(() => {
    if (isBingo) {
      playWin();
    }
  }, [isBingo, playWin]);

  return {
    card,
    marked,
    toggleCell,
    resetGame,
    isBingo,
    setCard,
    setMarked
  };
}
