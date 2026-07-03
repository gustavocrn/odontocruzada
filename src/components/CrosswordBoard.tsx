"use client";

import React, { useEffect, useRef, useState } from "react";
import { GeneratorResult, PlacedWord } from "@/utils/generator";
import { soundManager } from "@/utils/sound";

interface CrosswordBoardProps {
  data: GeneratorResult;
  activeWord: PlacedWord | null;
  onSelectWord: (word: PlacedWord) => void;
  focusedCell: { x: number; y: number } | null;
  onFocusCell: (cell: { x: number; y: number } | null) => void;
  inputs: Record<string, string>;
  onChangeInputs: (inputs: Record<string, string>) => void;
  solvedWords: number[];
  onWordSolved: (wordNum: number) => void;
}

export default function CrosswordBoard({
  data,
  activeWord,
  onSelectWord,
  focusedCell,
  onFocusCell,
  inputs,
  onChangeInputs,
  solvedWords,
  onWordSolved,
}: CrosswordBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [shaking, setShaking] = useState(false);
  const [incorrectWords, setIncorrectWords] = useState<number[]>([]);

  // Monitora tamanho do contêiner para aplicar zoom/escala automática na grade
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const cellWidth = 36; // Tamanho base da célula + gap
      const boardWidth = data.width * cellWidth + 24; // Inclui padding lateral
      
      if (boardWidth > containerWidth) {
        setScale(containerWidth / boardWidth);
      } else {
        setScale(1);
      }
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [data.width]);

  // Função auxiliar para checar se a célula faz parte da palavra selecionada
  const isCellInActiveWord = (x: number, y: number) => {
    if (!activeWord) return false;
    const len = activeWord.word.length;
    for (let i = 0; i < len; i++) {
      const cx = activeWord.x + (activeWord.dir === "H" ? i : 0);
      const cy = activeWord.y + (activeWord.dir === "V" ? i : 0);
      if (cx === x && cy === y) return true;
    }
    return false;
  };

  // Checa se a palavra é correta quando o usuário preenche a última letra dela
  const checkSingleWordCompleteness = (wordObj: PlacedWord, currentInputs: Record<string, string>) => {
    const len = wordObj.word.length;
    let isComplete = true;
    let typedWord = "";

    for (let i = 0; i < len; i++) {
      const cx = wordObj.x + (wordObj.dir === "H" ? i : 0);
      const cy = wordObj.y + (wordObj.dir === "V" ? i : 0);
      const letter = currentInputs[`${cx},${cy}`] || "";
      if (letter === "") {
        isComplete = false;
        break;
      }
      typedWord += letter;
    }

    if (isComplete && !solvedWords.includes(wordObj.number)) {
      // Se terminou de digitar e a palavra está correta
      if (typedWord === wordObj.word) {
        soundManager.playSFX("correct");
        onWordSolved(wordObj.number);
        
        // Remove dos incorretos se estivesse lá
        setIncorrectWords((prev) => prev.filter((id) => id !== wordObj.number));
      } else {
        // Se terminou e está incorreta
        soundManager.playSFX("error");
        setIncorrectWords((prev) => prev.includes(wordObj.number) ? prev : [...prev, wordObj.number]);
        
        // Animação de tremor
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
    }
  };

  // Trata digitação de caracteres individuais
  const handleCellInput = (x: number, y: number, char: string) => {
    const cellKey = `${x},${y}`;
    const cellInfo = data.grid[y][x];
    if (!cellInfo) return;

    // Se a célula pertence a uma palavra resolvida, bloqueia edição
    const isLocked = cellInfo.words.some((num) => solvedWords.includes(num));
    if (isLocked) return;

    const normalizedChar = char.toUpperCase();
    const newInputs = { ...inputs, [cellKey]: normalizedChar };
    onChangeInputs(newInputs);

    // Se o caractere não for vazio, remove o destaque de incorreto da palavra ativa
    if (activeWord && normalizedChar !== "") {
      setIncorrectWords((prev) => prev.filter((id) => id !== activeWord.number));
    }

    // Verifica se completou a palavra atual
    if (activeWord) {
      checkSingleWordCompleteness(activeWord, newInputs);
      
      // Move foco para a próxima célula caso tenha digitado algo
      if (normalizedChar !== "") {
        moveFocus(1);
      }
    }
  };

  // Trata o apagar de caracteres
  const handleCellDelete = (x: number, y: number) => {
    const cellKey = `${x},${y}`;
    const cellInfo = data.grid[y][x];
    if (!cellInfo) return;

    // Se pertence a alguma palavra já resolvida, bloqueia
    if (cellInfo.words.some((num) => solvedWords.includes(num))) return;

    const newInputs = { ...inputs };
    const hadValue = newInputs[cellKey] && newInputs[cellKey] !== "";
    newInputs[cellKey] = "";
    onChangeInputs(newInputs);

    if (activeWord) {
      setIncorrectWords((prev) => prev.filter((id) => id !== activeWord.number));
    }

    // Se o campo já estava vazio, move para trás
    if (!hadValue) {
      moveFocus(-1);
    }
  };

  // Move o cursor de digitação (+1 avançar, -1 retroceder)
  const moveFocus = (offset: number) => {
    if (!activeWord || !focusedCell) return;
    const { x, y } = focusedCell;
    const nx = x + (activeWord.dir === "H" ? offset : 0);
    const ny = y + (activeWord.dir === "V" ? offset : 0);

    // Limites da palavra ativa
    const index = activeWord.dir === "H" ? nx - activeWord.x : ny - activeWord.y;
    if (index >= 0 && index < activeWord.word.length) {
      onFocusCell({ x: nx, y: ny });
      
      const input = document.getElementById(`cell-${nx}-${ny}`);
      if (input) (input as HTMLInputElement).focus();
    }
  };

  // Trata a seleção da célula e troca de direção na interseção
  const handleCellClick = (x: number, y: number) => {
    const cell = data.grid[y][x];
    if (!cell) return;

    onFocusCell({ x, y });

    // Alterna direção se for cruzamento
    if (cell.words.length > 1 && activeWord) {
      const currentDir = activeWord.dir;
      const otherWordNum = cell.words.find((num) => num !== activeWord.number);
      if (otherWordNum !== undefined) {
        const otherWord = data.words.find((w) => w.number === otherWordNum);
        if (otherWord) {
          onSelectWord(otherWord);
          return;
        }
      }
    }

    // Seleciona a palavra que cruza
    const wordNum = cell.words[0];
    const wordObj = data.words.find((w) => w.number === wordNum);
    if (wordObj) onSelectWord(wordObj);
  };

  // Escuta teclas de seta e comandos físicos
  const handleKeyDown = (x: number, y: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    if (key === "Backspace") {
      e.preventDefault();
      handleCellDelete(x, y);
    } else if (key === "ArrowUp") {
      e.preventDefault();
      focusAdjacentCell(x, y - 1);
    } else if (key === "ArrowDown") {
      e.preventDefault();
      focusAdjacentCell(x, y + 1);
    } else if (key === "ArrowLeft") {
      e.preventDefault();
      focusAdjacentCell(x - 1, y);
    } else if (key === "ArrowRight") {
      e.preventDefault();
      focusAdjacentCell(x + 1, y);
    } else if (/^[A-Za-z\u00C0-\u00FF]$/.test(key)) {
      e.preventDefault();
      handleCellInput(x, y, key);
    }
  };

  const focusAdjacentCell = (tx: number, ty: number) => {
    if (tx >= 0 && tx < data.width && ty >= 0 && ty < data.height) {
      const cell = data.grid[ty][tx];
      if (cell) {
        onFocusCell({ x: tx, y: ty });
        const input = document.getElementById(`cell-${tx}-${ty}`);
        if (input) (input as HTMLInputElement).focus();
      }
    }
  };

  // Garante que o input focado receba foco se a prop focusedCell mudar
  useEffect(() => {
    if (focusedCell) {
      const input = document.getElementById(`cell-${focusedCell.x}-${focusedCell.y}`);
      if (input && document.activeElement !== input) {
        (input as HTMLInputElement).focus();
      }
    }
  }, [focusedCell]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden flex items-center justify-center p-4 min-h-[300px] transition-transform duration-100 ${
        shaking ? "shake-element" : ""
      }`}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          gridTemplateColumns: `repeat(${data.width}, minmax(0, 1fr))`,
        }}
        className="grid gap-1.5 p-3 rounded-2xl bg-darkbg-surface border border-darkbg-border select-none shadow-xl transition-all duration-300"
      >
        {data.grid.map((row, y) =>
          row.map((cell, x) => {
            if (cell === null) {
              return (
                <div
                  key={`empty-${x}-${y}`}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-transparent"
                />
              );
            }

            const cellKey = `${x},${y}`;
            const value = inputs[cellKey] || "";
            const isFocused = focusedCell?.x === x && focusedCell?.y === y;
            const inActiveWord = isCellInActiveWord(x, y);
            const isCellSolved = cell.words.some((num) => solvedWords.includes(num));
            const isCellIncorrect = cell.words.some((num) => incorrectWords.includes(num));

            const startsHorizontalWord = data.words.find(w => w.x === x && w.y === y && w.dir === "H");
            const startsVerticalWord = data.words.find(w => w.x === x && w.y === y && w.dir === "V");

            return (
              <div
                key={`cell-${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                className={`w-8 h-8 sm:w-9 sm:h-9 relative rounded-lg border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                  isCellSolved
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-extrabold correct-pulse"
                    : isCellIncorrect
                    ? "bg-red-500/25 border-red-500 text-red-400"
                    : isFocused
                    ? "bg-dentist-500 border-dentist-500 text-white shadow-md ring-2 ring-dentist-500/35 scale-105 z-10"
                    : inActiveWord
                    ? "bg-dentist-500/10 border-dentist-500/35 text-slate-100"
                    : "bg-slate-800/80 border-slate-700/80 text-slate-100 hover:border-slate-500"
                }`}
              >
                {/* Badge Direcional Horizontal (Esquerda) */}
                {startsHorizontalWord && (
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full shadow-md flex items-center justify-center pointer-events-none select-none z-20 border border-white/20">
                    {startsHorizontalWord.number}→
                  </div>
                )}

                {/* Badge Direcional Vertical (Topo) */}
                {startsVerticalWord && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-dentist-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full shadow-md flex items-center justify-center pointer-events-none select-none z-20 border border-white/20">
                    {startsVerticalWord.number}↓
                  </div>
                )}

                {/* Input Invisível */}
                <input
                  id={`cell-${x}-${y}`}
                  type="text"
                  maxLength={1}
                  value={value}
                  readOnly={isCellSolved}
                  inputMode="none"
                  autoComplete="off"
                  onKeyDown={(e) => handleKeyDown(x, y, e)}
                  onChange={(e) => handleCellInput(x, y, e.target.value)}
                  className="w-full h-full text-center font-extrabold text-base sm:text-lg uppercase bg-transparent outline-none caret-transparent cursor-pointer"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
