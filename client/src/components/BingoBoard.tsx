type Line =
  | { type: "row"; index: number }
  | { type: "col"; index: number }
  | { type: "diag"; dir: "main" | "anti" };

type Props = {
  card: number[][];
  marked: boolean[][];
  onCellClick: (r: number, c: number) => void;
  winningLines?: Line[];
  highlightNumber?: number | null;
  disabled?: boolean;
};

const headers = ["B", "I", "N", "G", "O"];

export function BingoBoard({
  card,
  marked,
  onCellClick,
  winningLines = [],
  highlightNumber = null,
  disabled = false,
}: Props) {
  return (
    <div className="relative">
      {/* 🔥 MULTICOLOR NEON HEADER */}
      <div className="grid grid-cols-5 gap-3 mb-3">
        {headers.map((h, i) => (
          <div
            key={h}
            className="text-center font-black text-xl neon-bingo-header"
            style={{ animationDelay: `${i * 0.3}s` }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* 🟨 BOARD GRID */}
      <div className="grid grid-cols-5 gap-3 relative">
        {card.map((row, r) =>
          row.map((num, c) => {
            const isHighlighted = num === highlightNumber;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => !disabled && onCellClick(r, c)}
                disabled={disabled}
                className={`relative bingo-cell ${marked[r]?.[c] ? "marked" : ""
                  } ${isHighlighted ? "animate-pulse border-red-500 shadow-[0_0_20px_red] text-red-500" : ""}`}
              >
                {num}

                {/* ❌ PERMANENT CROSS */}
                {marked[r]?.[c] && (
                  <span className="absolute inset-0 flex items-center justify-center text-red-500 text-4xl font-black drop-shadow-[0_0_15px_red]">
                    ✕
                  </span>
                )}
              </button>
            );
          })
        )}

        {/* ===================== */}
        {/* 🔥 LASER WIN LINES */}
        {/* ===================== */}
        {winningLines.map((line, i) => {
          if (line.type === "row") {
            return (
              <div
                key={`row-${i}`}
                className="absolute left-0 right-0 h-1 laser-line"
                style={{ top: `${line.index * 20 + 10}%` }}
              />
            );
          }

          if (line.type === "col") {
            return (
              <div
                key={`col-${i}`}
                className="absolute top-0 bottom-0 w-1 laser-line"
                style={{ left: `${line.index * 20 + 10}%` }}
              />
            );
          }

          if (line.type === "diag" && line.dir === "main") {
            return (
              <div
                key={`diag-main-${i}`}
                className="absolute inset-0 laser-line rotate-45"
              />
            );
          }

          if (line.type === "diag" && line.dir === "anti") {
            return (
              <div
                key={`diag-anti-${i}`}
                className="absolute inset-0 laser-line -rotate-45"
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
