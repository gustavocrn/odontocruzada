"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { PlacedWord } from "@/utils/generator";

interface ClueItemProps {
  word: PlacedWord;
  isSelected: boolean;
  isSolved: boolean;
  onClick: () => void;
}

export default function ClueItem({ word, isSelected, isSolved, onClick }: ClueItemProps) {
  const [expanded, setExpanded] = useState(false);

  const directionSymbol = word.dir === "H" ? "→" : "↓";
  const label = `${word.number}${directionSymbol}`;
  const isLong = word.clue.length > 55;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-2.5 rounded-xl border flex flex-col gap-1 transition-all duration-200 cursor-pointer select-none ${
        isSolved
          ? "opacity-50 border-emerald-500/30"
          : isSelected
          ? "border-dentist-500 bg-dentist-500/10 shadow-md ring-1 ring-dentist-500/20 scale-[1.01]"
          : "border-darkbg-border hover:border-slate-600 bg-slate-800/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {/* Indicador de Número e Direção */}
          <span
            className={`px-2 py-0.5 rounded font-extrabold text-xs tracking-wider flex items-center justify-center ${
              isSolved
                ? "bg-emerald-500/20 text-emerald-400"
                : isSelected
                ? "bg-dentist-500 text-white"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {label}
          </span>

          {/* Texto da Dica */}
          <div className="flex-1">
            <p
              className={`text-xs md:text-sm font-medium leading-relaxed ${
                isSolved ? "text-slate-400 line-through" : "text-slate-100"
              } ${!expanded && isLong ? "line-clamp-2" : ""}`}
            >
              {word.clue}
            </p>
          </div>
        </div>

        {/* Botão de Expandir se a dica for muito longa */}
        {isLong && (
          <button
            onClick={handleToggleExpand}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors self-start"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
