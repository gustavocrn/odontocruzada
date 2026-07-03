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
  onReturnLetterToPool: (x: number, y: number) => void;
  incorrectWords: number[];
  theme: "dark" | "light";
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
  onReturnLetterToPool,
  incorrectWords,
  theme,
}: CrosswordBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [shaking, setShaking] = useState(false);

  const prevIncorrectCountRef = useRef(incorrectWords.length);
  useEffect(() => {
    if (incorrectWords.length > prevIncorrectCountRef.current) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    prevIncorrectCountRef.current = incorrectWords.length;
  }, [incorrectWords]);

  // Monitora tamanho do contêiner para aplicar zoom/escala automática na grade
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const cellWidth = 46; // Tamanho base da célula + gap (aumentado de 36)
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

  // Trata a seleção da célula e troca de direção na interseção
  const handleCellClick = (x: number, y: number) => {
    const cell = data.grid[y][x];
    if (!cell) return;

    const cellKey = `${x},${y}`;
    const value = inputs[cellKey] || "";
    const isCellSolved = cell.words.some((num) => solvedWords.includes(num));

    // Define a célula como focada primeiro
    onFocusCell({ x, y });

    // Alterna direção se for cruzamento
    if (cell.words.length > 1 && activeWord) {
      const otherWordNum = cell.words.find((num) => num !== activeWord.number);
      if (otherWordNum !== undefined) {
        const otherWord = data.words.find((w) => w.number === otherWordNum);
        if (otherWord) {
          onSelectWord(otherWord);
        }
      }
    } else {
      const wordNum = cell.words[0];
      const wordObj = data.words.find((w) => w.number === wordNum);
      if (wordObj) onSelectWord(wordObj);
    }

    // Se a célula já contiver uma letra e não estiver resolvida, devolve ao pool
    if (value !== "" && !isCellSolved) {
      onReturnLetterToPool(x, y);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className={`w-full overflow-auto max-h-[60vh] flex items-start justify-center p-3 rounded-3xl transition-transform duration-100 ${
          shaking ? "shake-element" : ""
        } ${
          theme === "dark" 
            ? "bg-slate-900/10 border border-slate-800/40 shadow-inner" 
            : "bg-slate-100/50 border border-slate-250 shadow-inner"
        }`}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            gridTemplateColumns: `repeat(${data.width}, minmax(0, 1fr))`,
          }}
          className={`grid gap-1.5 p-3 rounded-2xl select-none shadow-xl transition-all duration-300 ${
            theme === "dark"
              ? "bg-darkbg-surface border border-darkbg-border"
              : "bg-white border border-slate-250"
          }`}
        >
          {data.grid.map((row, y) =>
            row.map((cell, x) => {
              if (cell === null) {
                return (
                  <div
                    key={`empty-${x}-${y}`}
                    className="w-10 h-10 sm:w-11 sm:h-11 bg-transparent"
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
                  className={`w-10 h-10 sm:w-11 sm:h-11 relative rounded-xl border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    isCellSolved
                      ? theme === "dark"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-extrabold correct-pulse"
                        : "bg-emerald-50 border-emerald-500 text-emerald-600 font-extrabold correct-pulse"
                      : isCellIncorrect
                      ? theme === "dark"
                        ? "bg-red-500/25 border-red-500 text-red-400"
                        : "bg-red-50 border-red-500 text-red-600"
                      : isFocused
                      ? "bg-[#ffee58] border-[#fbc02d] text-slate-900 shadow-md ring-2 ring-[#ffee58]/55 scale-105 z-10"
                      : inActiveWord
                      ? theme === "dark"
                        ? "bg-[#0d47a1]/50 border-[#1565c0]/50 text-slate-100"
                        : "bg-[#bbdefb] border-[#90caf9] text-slate-900"
                      : theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-500"
                      : "bg-white border-slate-350 text-slate-900 shadow-sm hover:border-slate-400"
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

                  {/* Letra Centralizada */}
                  <span className="font-extrabold text-base sm:text-lg uppercase select-none pointer-events-none">
                    {value}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
