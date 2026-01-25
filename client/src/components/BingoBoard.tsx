type Props = {
  card: number[][];
  marked: boolean[][];
  onCellClick: (r: number, c: number) => void;
  disabled?: boolean;
};

const headers = ["B", "I", "N", "G", "O"];

export function BingoBoard({
  card,
  marked,
  onCellClick,
  disabled,
}: Props) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {/* 🔹 BINGO HEADER */}
      {headers.map((h) => (
        <div
          key={h}
          className="text-center font-black text-xl text-neon-blue neon-text"
        >
          {h}
        </div>
      ))}

      {/* 🔹 BINGO CELLS */}
      {card.map((row, r) =>
        row.map((num, c) => (
          <button
            key={`${r}-${c}`}
            disabled={disabled}
            onClick={() => onCellClick(r, c)}
            className={`bingo-cell ${
              marked[r][c] ? "marked" : ""
            }`}
          >
            {num}
          </button>
        ))
      )}
    </div>
  );
}
