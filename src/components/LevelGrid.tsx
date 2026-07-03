"use client";

import React, { useState } from "react";
import { Lock, Star, Trophy } from "lucide-react";
import { OdontoDatabase } from "@/data/database";
import { soundManager } from "@/utils/sound";

interface LevelGridProps {
  highestUnlockedLevel: number;
  unlockedLevels: Record<number, { stars: number; bestScore: number }>;
  onSelectLevel: (levelId: number) => void;
}

export default function LevelGrid({
  highestUnlockedLevel,
  unlockedLevels,
  onSelectLevel,
}: LevelGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Categorias únicas
  const categories = Array.from(new Set(OdontoDatabase.map((l) => l.category)));

  const handleLevelClick = (levelId: number, isLocked: boolean) => {
    if (isLocked) {
      soundManager.playSFX("error");
      return;
    }
    soundManager.playSFX("click");
    onSelectLevel(levelId);
  };

  const filteredLevels = activeCategory
    ? OdontoDatabase.filter((l) => l.category === activeCategory)
    : OdontoDatabase;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Abas horizontais de Filtro */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-image">
        <button
          onClick={() => {
            soundManager.playSFX("click");
            setActiveCategory(null);
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
            activeCategory === null
              ? "bg-dentist-500 text-white shadow-btn-primary"
              : "bg-darkbg-surface hover:bg-darkbg-hover text-slate-300 border border-darkbg-border"
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              soundManager.playSFX("click");
              setActiveCategory(cat);
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-dentist-500 text-white shadow-btn-primary"
                : "bg-darkbg-surface hover:bg-darkbg-hover text-slate-300 border border-darkbg-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Fases */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredLevels.map((lvl) => {
          const isLocked = lvl.id > highestUnlockedLevel;
          const isActive = lvl.id === highestUnlockedLevel;
          const progress = unlockedLevels[lvl.id] || { stars: 0, bestScore: 0 };

          return (
            <div
              key={lvl.id}
              onClick={() => handleLevelClick(lvl.id, isLocked)}
              className={`glass-panel p-4 rounded-2xl relative flex flex-col gap-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                isLocked
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:-translate-y-1 hover:border-dentist-500 hover:shadow-lg"
              } ${isActive ? "border-dentist-500 ring-2 ring-dentist-500/20" : ""}`}
            >
              {/* Canto superior com número e lock */}
              <div className="flex justify-between items-center">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${
                    isActive
                      ? "bg-dentist-500 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {lvl.id}
                </span>
                {isLocked && <Lock size={16} className="text-slate-500" />}
              </div>

              {/* Título e Categoria */}
              <div className="mt-2 flex-1">
                <h4 className="font-bold text-slate-100 text-sm md:text-base leading-tight">
                  {lvl.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                  {lvl.category}
                </p>
              </div>

              {/* Estrelas e Pontuação */}
              {!isLocked && (
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-darkbg-border">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={
                          s <= progress.stars
                            ? "fill-amber-400 stroke-amber-400"
                            : "text-slate-600"
                        }
                      />
                    ))}
                  </div>
                  {progress.bestScore > 0 && (
                    <div className="flex items-center gap-0.5 text-xs text-slate-300 font-bold">
                      <Trophy size={12} className="text-amber-400" />
                      {progress.bestScore}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
