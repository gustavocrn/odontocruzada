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
    <div className="w-full flex flex-col items-center gap-3">
      {/* Controles de Zoom para Acessibilidade */}
      <div className="flex gap-2 self-end px-4 select-none">
        <button
          onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-extrabold flex items-center justify-center hover:bg-slate-700 text-xs active:scale-95 transition-transform"
          title="Diminuir Grade"
        >
          A-
        </button>
        <button
          onClick={() => setScale(1)}
          className="px-2.5 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center hover:bg-slate-700 text-[10px] active:scale-95 transition-transform"
        >
          100%
        </button>
        <button
          onClick={() => setScale((s) => Math.min(1.8, s + 0.1))}
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-extrabold flex items-center justify-center hover:bg-slate-700 text-xs active:scale-95 transition-transform"
          title="Aumentar Grade"
        >
          A+
        </button>
      </div>

      <div
        ref={containerRef}
        className={`w-full overflow-auto max-h-[60vh] flex items-start justify-center p-6 bg-slate-900/10 rounded-3xl border border-slate-800/40 shadow-inner min-h-[320px] transition-transform duration-100 ${
          shaking ? "shake-element" : ""
        }`}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
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
