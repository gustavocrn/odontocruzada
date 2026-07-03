"use client";

import React from "react";
import { Delete } from "lucide-react";
import { soundManager } from "@/utils/sound";

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  visible: boolean;
}

export default function VirtualKeyboard({ onKeyPress, visible }: VirtualKeyboardProps) {
  if (!visible) return null;

  const row1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const row2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const row3 = ["Z", "X", "C", "V", "B", "N", "M"];

  const handleKeyClick = (key: string) => {
    soundManager.playSFX("click");
    onKeyPress(key);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-darkbg-surface border-t border-darkbg-border p-2 z-40 flex flex-col gap-1.5 shadow-2xl select-none md:hidden pb-safe">
      {/* Primeira Linha */}
      <div className="flex justify-center gap-1 w-full max-w-lg mx-auto">
        {row1.map((char) => (
          <button
            key={char}
            onClick={() => handleKeyClick(char)}
            className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md font-bold text-lg active:bg-dentist-500 active:text-white transition-colors duration-75 flex items-center justify-center"
          >
            {char}
          </button>
        ))}
      </div>

      {/* Segunda Linha */}
      <div className="flex justify-center gap-1 w-full max-w-lg mx-auto pl-2.5 pr-2.5">
        {row2.map((char) => (
          <button
            key={char}
            onClick={() => handleKeyClick(char)}
            className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md font-bold text-lg active:bg-dentist-500 active:text-white transition-colors duration-75 flex items-center justify-center"
          >
            {char}
          </button>
        ))}
        {/* Tecla Backspace reposicionada para conveniência */}
        <button
          onClick={() => handleKeyClick("BACKSPACE")}
          className="w-12 h-11 bg-slate-700 text-slate-200 rounded-md font-bold active:bg-red-600 active:text-white flex items-center justify-center"
        >
          <Delete size={20} />
        </button>
      </div>

      {/* Terceira Linha */}
      <div className="flex justify-center gap-1 w-full max-w-lg mx-auto pl-5 pr-5">
        {row3.map((char) => (
          <button
            key={char}
            onClick={() => handleKeyClick(char)}
            className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md font-bold text-lg active:bg-dentist-500 active:text-white transition-colors duration-75 flex items-center justify-center"
          >
            {char}
          </button>
        ))}
        <button
          onClick={() => handleKeyClick("ENTER")}
          className="w-16 h-11 bg-dentist-500 text-white rounded-md font-bold text-sm active:bg-dentist-600 flex items-center justify-center shadow-btn-primary"
        >
          IR
        </button>
      </div>
    </div>
  );
}
