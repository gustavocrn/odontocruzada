export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  condition: (state: {
    levelsCompleted: number;
    playerLevel: number;
    highestUnlockedLevel: number;
    lastHintsUsed: number;
    lastTimeSpent: number;
    totalExplanationsRead: number;
  }) => boolean;
}

export const AchievementsList: Achievement[] = [
  { id: "first_step", title: "Primeiro Passo", desc: "Concluiu a Fase 1 (Conceitos Básicos).", icon: "🏆", condition: (state) => state.levelsCompleted >= 1 },
  { id: "graduando", title: "Graduando", desc: "Alcançou o Nível de Jogador 5.", icon: "🎓", condition: (state) => state.playerLevel >= 5 },
  { id: "cirurgiao", title: "Cirurgião Master", desc: "Alcançou o Nível de Jogador 10.", icon: "👑", condition: (state) => state.playerLevel >= 10 },
  { id: "perfect_solve", title: "Mente Brilhante", desc: "Concluiu uma fase sem usar nenhuma dica de letra.", icon: "✨", condition: (state) => state.lastHintsUsed === 0 && state.levelsCompleted > 0 },
  { id: "specialist", title: "Especialista Geral", desc: "Desbloqueou todas as especialidades (Fase 46+).", icon: "🦷", condition: (state) => state.highestUnlockedLevel >= 46 },
  { id: "fast_solver", title: "Veloz e Preciso", desc: "Concluiu uma fase em menos de 2 minutos.", icon: "⚡", condition: (state) => state.lastTimeSpent <= 120 && state.lastTimeSpent > 0 },
  { id: "scientist", title: "Cientista", desc: "Visualizou a explicação de 10 palavras.", icon: "📚", condition: (state) => state.totalExplanationsRead >= 10 },
  { id: "doctor", title: "Doutor Honoris Causa", desc: "Concluiu todas as 50 fases de palavras cruzadas.", icon: "🏅", condition: (state) => state.levelsCompleted >= 50 }
];
