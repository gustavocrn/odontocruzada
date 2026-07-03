"use client";

import React from "react";
import { Lock, Award } from "lucide-react";
import { AchievementsList } from "@/data/achievements"; // Importamos a lista de conquistas da página principal

interface AchievementsPanelProps {
  unlockedAchievements: string[];
  onClose: () => void;
}

export default function AchievementsPanel({
  unlockedAchievements,
  onClose,
}: AchievementsPanelProps) {
  return (
    <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AchievementsList.map((ach) => {
          const isUnlocked = unlockedAchievements.includes(ach.id);

          return (
            <div
              key={ach.id}
              className={`glass-panel p-3.5 rounded-xl border flex items-center gap-3.5 transition-all duration-300 ${
                isUnlocked
                  ? "border-amber-500/30 bg-amber-500/5 shadow-sm"
                  : "border-darkbg-border opacity-50 bg-slate-800/10"
              }`}
            >
              {/* Ícone */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  isUnlocked
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                    : "bg-slate-800 border border-slate-700 text-slate-500"
                }`}
              >
                {isUnlocked ? ach.icon : <Lock size={20} />}
              </div>

              {/* Informações */}
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm text-slate-100 truncate">
                  {ach.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight font-medium">
                  {ach.desc}
                </p>
                {isUnlocked && (
                  <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5 mt-1.5 uppercase tracking-wider">
                    <Award size={10} /> Conquistada
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
