"use client";

import React from "react";
import { Clock, Star, Lightbulb, Compass } from "lucide-react";
import { OdontoDatabase } from "@/data/database";

interface StatsPanelProps {
  statistics: {
    totalPlayTime: number;
    perfectSolves: number;
    totalHintsUsed: number;
    totalExplanationsRead: number;
    averageAccuracy: number;
    totalPhasesPlayed: number;
  };
  unlockedLevels: Record<number, { stars: number; bestScore: number }>;
}

export default function StatsPanel({ statistics, unlockedLevels }: StatsPanelProps) {
  // Formata o tempo de jogo total (segundos -> horas e minutos)
  const formatTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Agrupa conquistas por especialidade
  const categoriesMap: Record<string, { total: number; completed: number; maxScore: number }> = {};
  
  OdontoDatabase.forEach((lvl) => {
    if (!categoriesMap[lvl.category]) {
      categoriesMap[lvl.category] = { total: 0, completed: 0, maxScore: 0 };
    }
    categoriesMap[lvl.category].total++;
    
    const progress = unlockedLevels[lvl.id];
    if (progress && progress.bestScore > 0) {
      categoriesMap[lvl.category].completed++;
      categoriesMap[lvl.category].maxScore = Math.max(categoriesMap[lvl.category].maxScore, progress.bestScore);
    }
  });

  return (
    <div className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto pr-1">
      {/* Grade de Indicadores Rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Clock className="text-dentist-500 mb-2" size={24} />
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Tempo Jogado
          </span>
          <strong className="text-base sm:text-lg mt-1 text-slate-100">
            {formatTime(statistics.totalPlayTime)}
          </strong>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Star className="text-amber-500 mb-2" size={24} />
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Fases Perfeitas
          </span>
          <strong className="text-base sm:text-lg mt-1 text-slate-100 font-black">
            {statistics.perfectSolves}
          </strong>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Lightbulb className="text-amber-400 mb-2" size={24} />
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Dicas Utilizadas
          </span>
          <strong className="text-base sm:text-lg mt-1 text-slate-100">
            {statistics.totalHintsUsed}
          </strong>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Compass className="text-dentist-500 mb-2" size={24} />
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Aulas Lidas
          </span>
          <strong className="text-base sm:text-lg mt-1 text-slate-100">
            {statistics.totalExplanationsRead}
          </strong>
        </div>
      </div>

      {/* Histórico por Especialidade */}
      <div className="glass-panel p-4 rounded-2xl border border-darkbg-border">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-100 mb-3 flex items-center gap-2">
          Progresso por Especialidade
        </h3>
        
        <div className="flex flex-col gap-3">
          {Object.keys(categoriesMap).map((cat) => {
            const info = categoriesMap[cat];
            const percent = Math.round((info.completed / info.total) * 100);

            return (
              <div key={cat} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{cat}</span>
                  <span className="text-slate-400 font-semibold">
                    {info.completed}/{info.total} ({percent}%)
                  </span>
                </div>
                
                {/* Barra de Progresso */}
                <div className="w-full h-2 rounded-full bg-slate-800 border border-darkbg-border overflow-hidden">
                  <div
                    style={{ width: `${percent}%` }}
                    className="h-full bg-gradient-to-r from-dentist-600 to-dentist-400 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
