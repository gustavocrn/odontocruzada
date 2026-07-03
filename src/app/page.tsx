"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Award,
  BarChart2,
  Settings as SettingsIcon,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  Moon,
  Sun,
  X,
  Clock,
  Star,
  CheckCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Home,
  CheckSquare,
  Eraser,
  Lock,
  ChevronDown,
  ChevronUp,
  Menu,
  GraduationCap,
  Brain,
  Trophy,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import { OdontoDatabase, Level } from "@/data/database";
import { CrosswordGenerator, GeneratorResult, PlacedWord } from "@/utils/generator";
import { soundManager } from "@/utils/sound";

// Componentes locais
import LevelGrid from "@/components/LevelGrid";
import CrosswordBoard from "@/components/CrosswordBoard";
import ClueItem from "@/components/ClueItem";
import AchievementsPanel from "@/components/AchievementsPanel";
import StatsPanel from "@/components/StatsPanel";
import Confetti from "@/components/Confetti";

import { AchievementsList, Achievement } from "@/data/achievements";

const mascotTips = [
  "O esmalte dental é o tecido mais mineralizado do corpo humano!",
  "A polpa é a única estrutura mole e vascularizada do dente.",
  "Sempre esterilize os instrumentais em autoclave a 121°C ou 134°C.",
  "A mandíbula é o único osso móvel da cabeça!",
  "Parabéns pelo progresso! Você está agindo como um profissional de elite.",
  "O periodonto de sustentação protege e fixa o dente nos maxilares.",
  "Dica clínica: uma boa anamnese evita 90% das intercorrências em consultório!",
];

export default function HomeRoot() {
  const [isLoaded, setIsLoaded] = useState(false);

  // --- ESTADOS GERAIS DE PROGRESSÃO ---
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXP, setPlayerXP] = useState(0);
  const [coins, setCoins] = useState(100);
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState(1);
  const [levelsCompleted, setLevelsCompleted] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState<Record<number, { stars: number; bestScore: number }>>({});
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [mascotTip, setMascotTip] = useState(mascotTips[0]);
  const [statistics, setStatistics] = useState({
    totalPlayTime: 0,
    perfectSolves: 0,
    totalHintsUsed: 0,
    totalExplanationsRead: 0,
    averageAccuracy: 100,
    totalPhasesPlayed: 0,
  });

  // --- ESTADOS DA TELA E MODAIS ---
  const [screen, setScreen] = useState<"home" | "levels" | "game" | "end">("home");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);

  // --- ESTADOS DA PARTIDA ATIVA ---
  const [currentLevelId, setCurrentLevelId] = useState<number | null>(null);
  const [currentLevelData, setCurrentLevelData] = useState<GeneratorResult | null>(null);
  const [activeWord, setActiveWord] = useState<PlacedWord | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [solvedWords, setSolvedWords] = useState<number[]>([]);
  const [incorrectWords, setIncorrectWords] = useState<number[]>([]);
  const [poolLetters, setPoolLetters] = useState<{ id: string; char: string; usedInCell: string | null }[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [hintsPenaltyPoints, setHintsPenaltyPoints] = useState(0);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [perfectRun, setPerfectRun] = useState(true);
  const [explanationActive, setExplanationActive] = useState(false);
  const [hintMenuOpen, setHintMenuOpen] = useState(false);

  // Estatísticas da última partida concluída (para conquistas)
  const [lastHintsUsed, setLastHintsUsed] = useState(0);
  const [lastTimeSpent, setLastTimeSpent] = useState(0);

  const [toasts, setToasts] = useState<{ id: string; title: string; icon: string }[]>([]);
  const timerRef = useRef<any>(null);
  const generatorRef = useRef(new CrosswordGenerator());

  // --- CARREGA DADOS DO LOCALSTORAGE ---
  useEffect(() => {
    const savedSave = localStorage.getItem("odontocross_save");
    if (savedSave) {
      try {
        const parsed = JSON.parse(savedSave);
        if (parsed.playerLevel) setPlayerLevel(parsed.playerLevel);
        if (parsed.playerXP) setPlayerXP(parsed.playerXP);
        if (parsed.coins !== undefined) setCoins(parsed.coins);
        if (parsed.highestUnlockedLevel) setHighestUnlockedLevel(parsed.highestUnlockedLevel);
        if (parsed.levelsCompleted) setLevelsCompleted(parsed.levelsCompleted);
        if (parsed.totalScore) setTotalScore(parsed.totalScore);
        if (parsed.unlockedLevels) setUnlockedLevels(parsed.unlockedLevels);
        if (parsed.unlockedAchievements) setUnlockedAchievements(parsed.unlockedAchievements);
        if (parsed.statistics) setStatistics(parsed.statistics);
      } catch (e) {
        console.error("Erro ao ler dados salvos:", e);
      }
    }

    const savedTheme = localStorage.getItem("odontocross_theme");
    if (savedTheme) {
      setTheme(savedTheme as "dark" | "light");
    }

    const savedSettings = localStorage.getItem("odontocross_settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setMusicOn(settings.musicOn ?? true);
        setSfxOn(settings.sfxOn ?? true);
        soundManager.isSFXEnabled = settings.sfxOn ?? true;
      } catch {}
    }

    setIsLoaded(true);
  }, []);

  // --- SALVA NO LOCALSTORAGE ---
  const saveProgress = (updates: {
    level?: number;
    xp?: number;
    coins?: number;
    highestLevel?: number;
    levelsComp?: number;
    totScore?: number;
    unlockedLvl?: Record<number, { stars: number; bestScore: number }>;
    unlockedAch?: string[];
    stats?: typeof statistics;
  }) => {
    const data = {
      playerLevel: updates.level ?? playerLevel,
      playerXP: updates.xp ?? playerXP,
      coins: updates.coins ?? coins,
      highestUnlockedLevel: updates.highestLevel ?? highestUnlockedLevel,
      levelsCompleted: updates.levelsComp ?? levelsCompleted,
      totalScore: updates.totScore ?? totalScore,
      unlockedLevels: updates.unlockedLvl ?? unlockedLevels,
      unlockedAchievements: updates.unlockedAch ?? unlockedAchievements,
      statistics: updates.stats ?? statistics,
    };
    localStorage.setItem("odontocross_save", JSON.stringify(data));
  };

  // --- APLICA TEMA ---
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("theme-light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("theme-light");
      document.documentElement.classList.add("dark");
    }
    localStorage.setItem("odontocross_theme", theme);
  }, [theme]);

  // --- INICIALIZA MÚSICA AMBIENTE ---
  useEffect(() => {
    soundManager.toggleMusic(musicOn && screen !== "home");
    return () => {
      soundManager.stopAmbientMusic();
    };
  }, [musicOn, screen]);

  // --- GERENCIA O CRONÔMETRO DE JOGO ---
  useEffect(() => {
    if (screen === "game" && !pauseOpen) {
      timerRef.current = setInterval(() => {
        setTimeSpent((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, pauseOpen]);

  const xpNeeded = 1000 + (playerLevel - 1) * 300;

  // --- INICIA UMA FASE ---
  const handleStartLevel = (levelId: number) => {
    const level = OdontoDatabase.find((l) => l.id === levelId);
    if (!level) return;

    // Geração procedural da grade
    const generated = generatorRef.current.generate(level.words);
    if (!generated) {
      alert("Falha ao gerar grade procedural. Tente novamente.");
      return;
    }

    setCurrentLevelData(generated);
    setScreen("game");

    // Verifica se tem um jogo salvo correspondente a esta fase para retomar!
    const activeGameStr = localStorage.getItem("odontocross_active_game");
    if (activeGameStr) {
      try {
        const activeGame = JSON.parse(activeGameStr);
        if (activeGame.levelId === levelId) {
          // Retoma o estado salvo!
          setCurrentLevelId(levelId);
          setInputs(activeGame.inputs || {});
          setSolvedWords(activeGame.solvedWords || []);
          setTimeSpent(activeGame.timeSpent || 0);
          setPerfectRun(activeGame.perfectRun ?? true);
          setHintsPenaltyPoints(activeGame.hintsPenaltyPoints || 0);
          setHintsUsedCount(activeGame.hintsUsedCount || 0);
          
          // Seleciona a primeira palavra não resolvida
          const firstUnsolved = generated.words.find(w => !activeGame.solvedWords.includes(w.number)) || generated.words[0];
          setActiveWord(firstUnsolved);
          setFocusedCell({ x: firstUnsolved.x, y: firstUnsolved.y });
          return;
        }
      } catch (e) {
        console.error("Erro ao retomar jogo salvo:", e);
      }
    }

    // Inicialização padrão do zero (se não há jogo salvo ou é de outra fase)
    setCurrentLevelId(levelId);
    setTimeSpent(0);
    setHintsPenaltyPoints(0);
    setHintsUsedCount(0);
    setPerfectRun(true);
    setSolvedWords([]);
    setIncorrectWords([]);
    setInputs({});
    setFocusedCell(null);
    setExplanationActive(false);
    setHintMenuOpen(false);

    // Seleciona a primeira palavra
    if (generated.words.length > 0) {
      setActiveWord(generated.words[0]);
      setFocusedCell({ x: generated.words[0].x, y: generated.words[0].y });
    }
  };

  // --- SALVA O ESTADO DA PARTIDA ATIVA EM TEMPO REAL ---
  useEffect(() => {
    if (screen === "game" && currentLevelId) {
      localStorage.setItem("odontocross_active_game", JSON.stringify({
        levelId: currentLevelId,
        inputs,
        solvedWords,
        timeSpent,
        perfectRun,
        hintsPenaltyPoints,
        hintsUsedCount
      }));
    }
  }, [currentLevelId, inputs, solvedWords, timeSpent, screen, perfectRun, hintsPenaltyPoints, hintsUsedCount]);

  // --- SINCRONIZA BANCO DE LETRAS DINÂMICO QUANDO A PALAVRA ATIVA MUDA ---
  useEffect(() => {
    if (!activeWord || !currentLevelData) return;

    // Garante que o activeWord pertence ao nível atual para evitar mismatch de transição de estado
    const wordExists = currentLevelData.words.some((w) => w.number === activeWord.number && w.word === activeWord.word);
    if (!wordExists) return;

    // 1. Limpa inputs temporários de células que não pertencem a palavras resolvidas
    const cleanedInputs = { ...inputs };
    let hasChanges = false;
    
    Object.keys(inputs).forEach((key) => {
      const [cx, cy] = key.split(",").map(Number);
      const cellInfo = currentLevelData.grid[cy]?.[cx];
      if (cellInfo) {
        const isSolved = cellInfo?.words?.some((num) => solvedWords.includes(num));
        if (!isSolved) {
          delete cleanedInputs[key];
          hasChanges = true;
        }
      }
    });
    
    if (hasChanges) {
      setInputs(cleanedInputs);
    }

    // 2. Encontra quais letras da palavra ativa ainda não estão preenchidas/resolvidas
    const targetChars: string[] = [];
    for (let i = 0; i < activeWord.word.length; i++) {
      const cx = activeWord.x + (activeWord.dir === "H" ? i : 0);
      const cy = activeWord.y + (activeWord.dir === "V" ? i : 0);
      const cellInfo = currentLevelData.grid[cy]?.[cx];
      if (cellInfo) {
        const isSolved = cellInfo?.words?.some((num) => solvedWords.includes(num));
        if (!isSolved) {
          targetChars.push(cellInfo.char.toUpperCase());
        }
      }
    }

    // 3. Adiciona letras extras aleatórias para completar exatamente 14 botões
    const noisePool = ["A", "E", "O", "S", "R", "T", "I", "M", "C", "P", "L", "U", "N", "D"];
    const finalSet = [...targetChars];
    while (finalSet.length < 14) {
      const randChar = noisePool[Math.floor(Math.random() * noisePool.length)];
      finalSet.push(randChar);
    }

    // 4. Embaralha
    for (let i = finalSet.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalSet[i], finalSet[j]] = [finalSet[j], finalSet[i]];
    }

    // 5. Cria o array de estado poolLetters
    const pool = finalSet.map((char, index) => ({
      id: `letter-${index}-${Math.random().toString(36).substr(2, 4)}`,
      char,
      usedInCell: null as string | null,
    }));

    setPoolLetters(pool);
  }, [activeWord]);

  // --- TRATA A SELEÇÃO DE UMA LETRA DO BANCO DE LETRAS (ANAGRAMA) ---
  const handleSelectLetterFromPool = (letterId: string) => {
    if (!focusedCell || !currentLevelData || !activeWord) return;
    const { x, y } = focusedCell;
    const cellKey = `${x},${y}`;

    // Se a célula pertence a uma palavra já resolvida, não permite digitar
    const cellInfo = currentLevelData.grid[y][x];
    if (!cellInfo) return;
    const isLocked = cellInfo.words?.some((num) => solvedWords.includes(num)) || false;
    if (isLocked) return;

    // Acha a letra no pool
    const letterIndex = poolLetters.findIndex((l) => l.id === letterId);
    if (letterIndex === -1) return;
    const letter = poolLetters[letterIndex];
    if (letter.usedInCell) return; // Letra já está em uso

    soundManager.playSFX("click");

    // Copia o pool e marca como usada na célula focada
    const nextPool = [...poolLetters];

    // Se a célula já tinha uma letra inserida anteriormente, devolve ela ao pool primeiro!
    const previousLetterIdx = nextPool.findIndex((l) => l.usedInCell === cellKey);
    if (previousLetterIdx !== -1) {
      nextPool[previousLetterIdx] = { ...nextPool[previousLetterIdx], usedInCell: null };
    }

    // Marca a nova letra como usada
    nextPool[letterIndex] = { ...nextPool[letterIndex], usedInCell: cellKey };
    setPoolLetters(nextPool);

    // Atualiza os inputs
    const newInputs = { ...inputs, [cellKey]: letter.char };
    setInputs(newInputs);

    // Remove do incorreto se o jogador está alterando
    setIncorrectWords((prev) => prev.filter((id) => id !== activeWord.number));

    // Checa se completou a palavra
    checkWordCompleteness(activeWord, newInputs);

    // Avança foco pulando células já resolvidas/travadas
    let next = getAdjacentCell(x, y, 1);
    while (next) {
      const nextCellInfo = currentLevelData.grid[next.y]?.[next.x];
      const isNextSolved = nextCellInfo?.words?.some((num) => solvedWords.includes(num)) || false;
      if (isNextSolved) {
        next = getAdjacentCell(next.x, next.y, 1);
      } else {
        break;
      }
    }
    if (next) {
      setFocusedCell(next);
    }
  };

  // --- DEVOLVE A LETRA DA CÉLULA DE VOLTA AO BANCO DE LETRAS ---
  const handleReturnLetterToPool = (x: number, y: number) => {
    if (!currentLevelData) return;
    const cellKey = `${x},${y}`;

    // Se pertence a alguma palavra já resolvida, bloqueia
    const cellInfo = currentLevelData.grid[y][x];
    if (!cellInfo) return;
    if (cellInfo.words.some((num) => solvedWords.includes(num))) return;

    soundManager.playSFX("click");

    // Limpa a célula nos inputs
    const newInputs = { ...inputs };
    delete newInputs[cellKey];
    setInputs(newInputs);

    // Remove do incorreto se o jogador apagou uma letra da palavra ativa
    if (activeWord) {
      setIncorrectWords((prev) => prev.filter((id) => id !== activeWord.number));
    }

    // Devolve a letra correspondente ao pool
    const nextPool = poolLetters.map((l) => {
      if (l.usedInCell === cellKey) {
        return { ...l, usedInCell: null };
      }
      return l;
    });
    setPoolLetters(nextPool);
  };

  // --- EMBARALHA AS LETRAS NÃO UTILIZADAS DO BANCO ---
  const shufflePool = () => {
    soundManager.playSFX("click");
    const unused = poolLetters.filter((l) => !l.usedInCell);
    const used = poolLetters.filter((l) => l.usedInCell);

    // Embaralha o array unused
    for (let i = unused.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unused[i], unused[j]] = [unused[j], unused[i]];
    }

    setPoolLetters([...unused, ...used]);
  };

  const getAdjacentCell = (x: number, y: number, offset: number) => {
    if (!activeWord) return null;
    const nx = x + (activeWord.dir === "H" ? offset : 0);
    const ny = y + (activeWord.dir === "V" ? offset : 0);
    const index = activeWord.dir === "H" ? nx - activeWord.x : ny - activeWord.y;
    if (index >= 0 && index < activeWord.word.length) {
      return { x: nx, y: ny };
    }
    return null;
  };

  const handleNavigateWord = (direction: "prev" | "next") => {
    if (!currentLevelData || !activeWord) return;
    const idx = currentLevelData.words.findIndex((w) => w.number === activeWord.number);
    let nextIdx = direction === "next" ? idx + 1 : idx - 1;
    if (nextIdx >= currentLevelData.words.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = currentLevelData.words.length - 1;
    
    soundManager.playSFX("click");
    const nextWord = currentLevelData.words[nextIdx];
    setActiveWord(nextWord);
    setFocusedCell({ x: nextWord.x, y: nextWord.y });
  };

  // Verifica preenchimento completo de uma palavra específica
  const checkWordCompleteness = (wordObj: PlacedWord, currentInputs: Record<string, string>) => {
    const len = wordObj.word.length;
    let typed = "";
    let complete = true;

    for (let i = 0; i < len; i++) {
      const cx = wordObj.x + (wordObj.dir === "H" ? i : 0);
      const cy = wordObj.y + (wordObj.dir === "V" ? i : 0);
      const letter = currentInputs[`${cx},${cy}`] || "";
      if (letter === "") {
        complete = false;
        break;
      }
      typed += letter;
    }

    if (complete && !solvedWords.includes(wordObj.number)) {
      if (typed === wordObj.word) {
        // Palavra Correta!
        const nextSolved = [...solvedWords, wordObj.number];
        setSolvedWords(nextSolved);
        soundManager.playSFX("correct");
        
        // Remove dos incorretos se estivesse lá
        setIncorrectWords((prev) => prev.filter((id) => id !== wordObj.number));
        
        // Verifica se fechou todo o jogo
        checkOverallCompletion(nextSolved);

        // --- PULA AUTOMATICAMENTE PARA A PRÓXIMA PALAVRA NÃO RESOLVIDA ---
        if (currentLevelData) {
          const nextUnsolvedWord = currentLevelData.words.find(
            (w) => !nextSolved.includes(w.number)
          );
          if (nextUnsolvedWord) {
            setTimeout(() => {
              setActiveWord(nextUnsolvedWord);
              setFocusedCell({ x: nextUnsolvedWord.x, y: nextUnsolvedWord.y });
            }, 300);
          }
        }
      } else {
        // Palavra incorreta
        soundManager.playSFX("error");
        setIncorrectWords((prev) => prev.includes(wordObj.number) ? prev : [...prev, wordObj.number]);
      }
    }
  };

  // Acionada quando uma palavra é marcada como resolvida no CrosswordBoard
  const handleWordSolved = (wordNum: number) => {
    const nextSolved = [...solvedWords, wordNum];
    setSolvedWords(nextSolved);
    checkOverallCompletion(nextSolved);
  };

  // Checa se o tabuleiro todo foi completado com sucesso
  const checkOverallCompletion = (currentSolved: number[]) => {
    if (!currentLevelData) return;
    if (currentSolved.length === currentLevelData.words.length) {
      // Sucesso total da fase
      handleLevelComplete();
    }
  };

  // --- FINALIZA E CALCULA SCORE DA FASE ---
  const handleLevelComplete = () => {
    if (!currentLevelData || !currentLevelId) return;

    soundManager.playSFX("fanfare");

    // Limpa jogo ativo salvo do localStorage
    localStorage.removeItem("odontocross_active_game");

    const totalWords = currentLevelData.words.length;
    const baseScore = totalWords * 100;
    const scoreEstimate = Math.max(0, baseScore - hintsPenaltyPoints);

    // Bônus
    let timeBonus = 0;
    if (timeSpent < 600) {
      timeBonus = Math.floor((600 - timeSpent) * 1.2);
    }
    let perfectBonus = 0;
    if (perfectRun && hintsUsedCount === 0) {
      perfectBonus = 500;
    }

    const finalScore = scoreEstimate + timeBonus + perfectBonus;
    const xpGained = Math.max(120, Math.floor(finalScore / 3));

    // Estrelas
    let starsWon = 1;
    if (scoreEstimate >= baseScore * 0.9) starsWon = 3;
    else if (scoreEstimate >= baseScore * 0.6) starsWon = 2;

    // Atualiza progresso da fase
    const previousRecord = unlockedLevels[currentLevelId] || { stars: 0, bestScore: 0 };
    const nextRecord = {
      stars: Math.max(previousRecord.stars, starsWon),
      bestScore: Math.max(previousRecord.bestScore, finalScore),
    };

    const nextUnlockedLevels = {
      ...unlockedLevels,
      [currentLevelId]: nextRecord,
    };
    setUnlockedLevels(nextUnlockedLevels);

    // Desbloqueia próxima fase
    let nextHighest = highestUnlockedLevel;
    if (currentLevelId === highestUnlockedLevel && currentLevelId < 50) {
      nextHighest = currentLevelId + 1;
      setHighestUnlockedLevel(nextHighest);
    }

    // Calcula XP e Level
    let nextXP = playerXP + xpGained;
    let nextLevel = playerLevel;
    let currentNeeded = 1000 + (nextLevel - 1) * 300;
    while (nextXP >= currentNeeded && nextLevel < 20) {
      nextXP -= currentNeeded;
      nextLevel++;
      currentNeeded = 1000 + (nextLevel - 1) * 300;
    }
    setPlayerLevel(nextLevel);
    setPlayerXP(nextXP);

    // Moedas Ganhas
    const coinsWon = 50 + starsWon * 10;
    const nextCoins = coins + coinsWon;
    setCoins(nextCoins);

    // Estatísticas acumuladas
    const isNewClear = previousRecord.bestScore === 0;
    const nextLevelsCompleted = isNewClear ? levelsCompleted + 1 : levelsCompleted;
    setLevelsCompleted(nextLevelsCompleted);
    setTotalScore((s) => s + (nextRecord.bestScore - previousRecord.bestScore));

    const nextStats = {
      totalPlayTime: statistics.totalPlayTime + timeSpent,
      perfectSolves: perfectBonus > 0 ? statistics.perfectSolves + 1 : statistics.perfectSolves,
      totalHintsUsed: statistics.totalHintsUsed + hintsUsedCount,
      totalExplanationsRead: statistics.totalExplanationsRead,
      averageAccuracy: 100, // Calculado sob demanda no stats modal
      totalPhasesPlayed: statistics.totalPhasesPlayed + 1,
    };
    setStatistics(nextStats);

    // Guarda temporários para o verificador de conquistas
    setLastHintsUsed(hintsUsedCount);
    setLastTimeSpent(timeSpent);

    // Checa conquistas unlocked
    const tempState = {
      levelsCompleted: nextLevelsCompleted,
      playerLevel: nextLevel,
      highestUnlockedLevel: nextHighest,
      lastHintsUsed: hintsUsedCount,
      lastTimeSpent: timeSpent,
      totalExplanationsRead: statistics.totalExplanationsRead,
    };

    const nextAchievements = [...unlockedAchievements];
    AchievementsList.forEach((ach) => {
      if (!nextAchievements.includes(ach.id) && ach.condition(tempState)) {
        nextAchievements.push(ach.id);
        triggerToast(ach.title, ach.icon);
      }
    });
    setUnlockedAchievements(nextAchievements);

    // Salva tudo
    saveProgress({
      level: nextLevel,
      xp: nextXP,
      coins: nextCoins,
      highestLevel: nextHighest,
      levelsComp: nextLevelsCompleted,
      totScore: totalScore + (nextRecord.bestScore - previousRecord.bestScore),
      unlockedLvl: nextUnlockedLevels,
      unlockedAch: nextAchievements,
      stats: nextStats,
    });

    setScreen("end");
  };

  // Exibe toast flutuante temporário
  const triggerToast = (title: string, icon: string) => {
    soundManager.playSFX("correct");
    const id = Math.random().toString();
    setToasts((t) => [...t, { id, title, icon }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 4000);
  };

  // --- SINCRONIZA O POOL DE LETRAS COM INPUTS EXTERNOS (DICAS) ---
  const syncPoolWithInputs = (nextInputs: Record<string, string>, currentPool: typeof poolLetters) => {
    const updatedPool = currentPool.map((l) => ({ ...l, usedInCell: l.usedInCell }));

    // Libera letras cujas células foram limpas
    updatedPool.forEach((l) => {
      if (l.usedInCell && !nextInputs[l.usedInCell]) {
        l.usedInCell = null;
      }
    });

    // Associa células preenchidas a letras correspondentes livres do banco
    Object.entries(nextInputs).forEach(([cellKey, char]) => {
      if (!char || char === "") return;
      const hasAssignment = updatedPool.some((l) => l.usedInCell === cellKey);
      if (!hasAssignment) {
        const match = updatedPool.find((l) => l.char === char && !l.usedInCell);
        if (match) {
          match.usedInCell = cellKey;
        }
      }
    });

    return updatedPool;
  };

  // --- SISTEMA DE DICAS ---
  const handleApplyHint = (type: "letter" | "half" | "explain" | "solve") => {
    if (!activeWord || !currentLevelData) return;

    const costs = { letter: 10, half: 30, explain: 5, solve: 50 };
    const cost = costs[type];

    if (coins < cost) {
      triggerToast("Moedas insuficientes!", "🪙");
      soundManager.playSFX("error");
      return;
    }

    const nextCoins = coins - cost;
    setCoins(nextCoins);
    saveProgress({ coins: nextCoins });

    if (type === "letter") {
      // Revela a letra atual focada
      if (!focusedCell) return;
      const { x, y } = focusedCell;
      const cellInfo = currentLevelData.grid[y][x];
      if (!cellInfo || !cellInfo.words.includes(activeWord.number)) return;

      const charIdx = activeWord.dir === "H" ? x - activeWord.x : y - activeWord.y;
      const correctChar = generatorRef.current.normalize(activeWord.word)[charIdx];

      const key = `${x},${y}`;
      if (inputs[key] !== correctChar) {
        soundManager.playSFX("click");
        const nextInputs = { ...inputs, [key]: correctChar };
        setInputs(nextInputs);
        setPoolLetters((prev) => syncPoolWithInputs(nextInputs, prev));
        setHintsPenaltyPoints((p) => p + 10);
        setHintsUsedCount((c) => c + 1);
        setPerfectRun(false);

        checkWordCompleteness(activeWord, nextInputs);
      }
    } else if (type === "half") {
      // Revela metade da palavra (posições pares)
      soundManager.playSFX("click");
      const nextInputs = { ...inputs };
      let changed = false;

      for (let i = 0; i < activeWord.word.length; i++) {
        if (i % 2 === 0) {
          const cx = activeWord.x + (activeWord.dir === "H" ? i : 0);
          const cy = activeWord.y + (activeWord.dir === "V" ? i : 0);
          const correctChar = generatorRef.current.normalize(activeWord.word)[i];
          const key = `${cx},${cy}`;

          if (inputs[key] !== correctChar) {
            nextInputs[key] = correctChar;
            changed = true;
          }
        }
      }

      if (changed) {
        setInputs(nextInputs);
        setPoolLetters((prev) => syncPoolWithInputs(nextInputs, prev));
        setHintsPenaltyPoints((p) => p + 30);
        setHintsUsedCount((c) => c + 1);
        setPerfectRun(false);

        checkWordCompleteness(activeWord, nextInputs);
      }
    } else if (type === "explain") {
      // Exibe explicação científica detalhada
      soundManager.playSFX("click");
      setExplanationActive(true);
      setHintsPenaltyPoints((p) => p + 5);
      setHintsUsedCount((c) => c + 1);
      
      const nextStats = {
        ...statistics,
        totalExplanationsRead: statistics.totalExplanationsRead + 1,
      };
      setStatistics(nextStats);
      saveProgress({ stats: nextStats });
    } else if (type === "solve") {
      // Resolve a palavra inteira
      soundManager.playSFX("click");
      const nextInputs = { ...inputs };
      let changed = false;

      for (let i = 0; i < activeWord.word.length; i++) {
        const cx = activeWord.x + (activeWord.dir === "H" ? i : 0);
        const cy = activeWord.y + (activeWord.dir === "V" ? i : 0);
        const correctChar = generatorRef.current.normalize(activeWord.word)[i];
        const key = `${cx},${cy}`;

        if (inputs[key] !== correctChar) {
          nextInputs[key] = correctChar;
          changed = true;
        }
      }

      if (changed) {
        setInputs(nextInputs);
        setPoolLetters((prev) => syncPoolWithInputs(nextInputs, prev));
        setHintsPenaltyPoints((p) => p + 50);
        setHintsUsedCount((c) => c + 1);
        setPerfectRun(false);

        // Marca como correta
        const nextSolved = [...solvedWords, activeWord.number];
        setSolvedWords(nextSolved);
        checkOverallCompletion(nextSolved);
      }
    }
  };

  const getCluesOfDirection = (dir: "H" | "V") => {
    if (!currentLevelData) return [];
    return currentLevelData.words.filter((w) => w.dir === dir);
  };

  const getEstimatedScore = () => {
    if (!currentLevelData) return 0;
    return Math.max(0, currentLevelData.words.length * 100 - hintsPenaltyPoints);
  };

  // Retorna rank formatado
  const getRank = (level: number) => {
    if (level >= 15) return "Doutor em Odontologia";
    if (level >= 10) return "Mestre Clínico";
    if (level >= 7) return "Cirurgião-Dentista";
    if (level >= 4) return "Residente Odonto";
    return "Estudante Clínico";
  };

  if (!isLoaded) return null;

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col selection:bg-dentist-500 selection:text-white transition-colors duration-300 ${
      theme === "dark"
        ? "text-slate-100 bg-gradient-to-b from-[#0a1122] to-[#040810]"
        : "text-slate-800 bg-gradient-to-b from-slate-50 to-slate-100"
    }`}>
      {/* Glow de fundo */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,163,181,0.12),transparent_45%)]" />

      {/* CABEÇALHO GLOBAL */}
      <header className={`glass-panel border-b py-2 px-4 sticky top-0 z-35 flex justify-between items-center backdrop-blur-md transition-colors duration-200 ${
        theme === "dark" ? "border-darkbg-border bg-slate-950/40" : "border-slate-200 bg-white/40"
      }`}>
        {screen === "game" ? (
          // Header Fiel à Referência com Menu de Dicas Dropdown
          <div className="w-full flex justify-between items-center select-none relative">
            {/* Lado Esquerdo: Voltar + Menu Níveis */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  if (confirm("Deseja mesmo sair do jogo em andamento?")) {
                    setScreen("levels");
                  }
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
                  theme === "dark"
                    ? "bg-slate-850 border-slate-700 text-slate-300 hover:text-white"
                    : "bg-white border-slate-250 text-slate-600 hover:text-slate-800 shadow-sm"
                }`}
                title="Voltar"
              >
                <ArrowLeft size={16} />
              </button>

              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setPauseOpen(true);
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
                  theme === "dark"
                    ? "bg-slate-850 border-slate-700 text-slate-300 hover:text-white"
                    : "bg-white border-slate-250 text-slate-600 hover:text-slate-800 shadow-sm"
                }`}
                title="Menu / Pausa"
              >
                <Menu size={16} />
              </button>
            </div>

            {/* Centro: FASE XX */}
            <h1 className={`font-black text-sm tracking-widest uppercase ${
              theme === "dark" ? "text-slate-100" : "text-slate-800"
            }`}>
              FASE {currentLevelId}
            </h1>

            {/* Lado Direito: Moedas + Botão Dica (Com Dropdown) */}
            <div className="flex items-center gap-2 relative">
              <div className={`text-xs font-black px-2 py-1.5 rounded-lg border font-mono ${
                theme === "dark"
                  ? "bg-slate-850 border-slate-700 text-amber-400"
                  : "bg-white border-slate-250 text-amber-600 shadow-sm"
              }`}>
                🪙 {coins}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    soundManager.playSFX("click");
                    setHintMenuOpen(!hintMenuOpen);
                  }}
                  className="h-9 px-3.5 bg-[#2196f3] hover:bg-[#1976d2] text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                >
                  <span>Dica</span>
                  <span className="text-[9px]">▼</span>
                </button>

                {/* Dropdown de Dicas */}
                {hintMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl border p-2 shadow-xl z-55 flex flex-col gap-1 backdrop-blur-md animate-fade-in ${
                    theme === "dark" 
                      ? "bg-slate-900/95 border-slate-700 text-slate-100" 
                      : "bg-white/95 border-slate-200 text-slate-800"
                  }`}>
                    <button
                      onClick={() => {
                        setHintMenuOpen(false);
                        handleApplyHint("letter");
                      }}
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                        theme === "dark" ? "hover:bg-slate-800/80 text-slate-200" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span>💡 Revelar Letra</span>
                      <span className="font-mono text-amber-500 font-extrabold">10 🪙</span>
                    </button>
                    <button
                      onClick={() => {
                        setHintMenuOpen(false);
                        handleApplyHint("half");
                      }}
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                        theme === "dark" ? "hover:bg-slate-800/80 text-slate-200" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span>⚡ Revelar Metade</span>
                      <span className="font-mono text-amber-500 font-extrabold">30 🪙</span>
                    </button>
                    <button
                      onClick={() => {
                        setHintMenuOpen(false);
                        handleApplyHint("explain");
                      }}
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                        theme === "dark" ? "hover:bg-slate-800/80 text-slate-200" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span>📖 Aula Rápida</span>
                      <span className="font-mono text-amber-500 font-extrabold">5 🪙</span>
                    </button>
                    <div className={`h-px my-1 ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`} />
                    <button
                      onClick={() => {
                        setHintMenuOpen(false);
                        if (confirm("Deseja realmente limpar todas as palavras digitadas nesta fase?")) {
                          soundManager.playSFX("click");
                          setInputs({});
                          setSolvedWords([]);
                          setPoolLetters((prev) => prev.map((l) => ({ ...l, usedInCell: null })));
                        }
                      }}
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-red-400 transition-colors ${
                        theme === "dark" ? "hover:bg-slate-850" : "hover:bg-red-50/50"
                      }`}
                    >
                      <span>🔄 Reiniciar Grade</span>
                      <span className="font-semibold text-slate-400">Grátis</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Header Padrão das Outras Telas
          <>
            {/* Lado Esquerdo: Voltar + Menu */}
            <div className="flex items-center gap-2">
              {screen !== "home" && (
                <button
                  onClick={() => {
                    soundManager.playSFX("click");
                    setScreen("home");
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
                    theme === "dark"
                      ? "bg-slate-850/80 border-slate-700 text-slate-300 hover:text-white"
                      : "bg-white border-slate-250 text-slate-600 hover:text-slate-800 shadow-sm"
                  }`}
                  title="Voltar"
                >
                  <ArrowLeft size={16} />
                </button>
              )}

              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setScreen("levels");
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
                  theme === "dark"
                    ? "bg-slate-850/80 border-slate-700 text-slate-300 hover:text-white"
                    : "bg-white border-slate-250 text-slate-600 hover:text-slate-800 shadow-sm"
                }`}
                title="Menu de Níveis"
              >
                <Menu size={16} />
              </button>
            </div>

            {/* Centro: Alternar Tema */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setTheme(theme === "dark" ? "light" : "dark");
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 active:scale-95 ${
                  theme === "dark"
                    ? "bg-slate-850/80 border-slate-700 text-slate-300 hover:text-white"
                    : "bg-white border-slate-250 text-slate-600 hover:text-slate-800 shadow-sm"
                }`}
                title="Alternar Tema"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>

            {/* Lado Direito: Configurações */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setSettingsOpen(true);
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
                  theme === "dark"
                    ? "bg-slate-850/80 border-slate-700 text-slate-300 hover:text-white"
                    : "bg-white border-slate-250 text-slate-600 hover:text-slate-800 shadow-sm"
                }`}
                title="Configurações"
              >
                <SettingsIcon size={16} />
              </button>
            </div>
          </>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL COM TRANSIÇÕES */}
      <main className={`flex-1 min-h-0 w-full mx-auto relative flex flex-col overflow-hidden ${
        screen === "game" ? "p-0" : "p-4 md:p-6"
      }`}>
        {/* TOASTS DE CONQUISTAS */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-amber-500/40 p-4 rounded-xl flex items-center gap-3 shadow-2xl animate-fade-in pointer-events-auto"
            >
              <span className="text-2xl">{t.icon}</span>
              <div>
                <h5 className="font-extrabold text-sm text-slate-100">
                  Conquista Desbloqueada!
                </h5>
                <p className="text-xs text-slate-400 font-semibold">{t.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TELA DE BOAS-VINDAS / HOME */}
        {screen === "home" && (
          <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto w-full py-6 animate-fade-in">
            {/* Mascot and Title Wrapper */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
              {/* Mascot Tooth */}
              <div className="relative w-48 h-48 md:w-60 md:h-60 shrink-0 select-none animate-bounce-slow">
                <div className="absolute inset-0 bg-gradient-to-tr from-dentist-500/20 to-emerald-500/20 blur-2xl rounded-full" />
                <img
                  src="/mascot.png"
                  alt="Mascote OdontoCruzada"
                  className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_10px_15px_rgba(20,163,181,0.35)]"
                />
              </div>

              {/* Title & Description */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4 max-w-lg">
                <div className="flex flex-col">
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-100 uppercase">
                    Odonto<span className="text-dentist-400">Cruzada</span>
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm uppercase tracking-widest font-extrabold mt-1">
                    O desafio do conhecimento em odontologia
                  </p>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  OdontoCruzada é o jogo de palavras cruzadas cirúrgico com 50 níveis e mais de 500 palavras em português. Pratique anatomia, procedimentos cirúrgicos, materiais restauradores e periodontia com explicações clínicas detalhadas a cada acerto!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                  <button
                    onClick={() => {
                      soundManager.playSFX("click");
                      handleStartLevel(highestUnlockedLevel);
                    }}
                    className="flex-1 h-14 bg-gradient-to-tr from-dentist-600 to-dentist-400 hover:from-dentist-500 hover:to-dentist-300 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-btn-primary transition-all hover:scale-[1.02]"
                  >
                    <Play size={20} className="fill-white" />
                    Jogar Agora
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playSFX("click");
                      setScreen("levels");
                    }}
                    className="flex-1 h-14 bg-slate-800/80 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    Escolher Fase
                  </button>
                </div>
              </div>
            </div>

            {/* Badges de Destaque da Imagem Piloto */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mt-4 pt-6 border-t border-darkbg-border">
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center gap-2 border border-darkbg-border bg-slate-800/30">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <GraduationCap size={24} />
                </div>
                <span className="text-xs font-bold text-slate-200">Aprenda</span>
              </div>
              
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center gap-2 border border-darkbg-border bg-slate-800/30">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Brain size={24} />
                </div>
                <span className="text-xs font-bold text-slate-200">Desafie</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center gap-2 border border-darkbg-border bg-slate-800/30">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <Trophy size={24} />
                </div>
                <span className="text-xs font-bold text-slate-200">Conquiste</span>
              </div>
            </div>

            {/* Painel de Perfil Rápido */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 w-full max-w-2xl border border-darkbg-border mt-2 bg-slate-800/10">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-dentist-400 flex items-center justify-center shadow-inner">
                  <Award size={22} />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-sm text-slate-100">Cirurgião Estudante</h3>
                  <span className="text-[10px] text-dentist-400 font-extrabold uppercase tracking-wider block">
                    {getRank(playerLevel)}
                  </span>
                </div>
              </div>

              {/* Barra de XP */}
              <div className="flex-1 flex flex-col gap-1 w-full">
                <div className="flex justify-between text-[11px] font-bold text-slate-300">
                  <span>Nível {playerLevel}</span>
                  <span>{playerXP} / {xpNeeded} XP</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-900 border border-darkbg-border overflow-hidden p-0.5">
                  <div
                    style={{ width: `${Math.min(100, (playerXP / xpNeeded) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-dentist-600 to-dentist-400 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Estatísticas Rápidas */}
              <div className="flex gap-4 shrink-0 font-bold text-xs text-slate-300">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Fases Feitas</span>
                  <span className="text-dentist-400 text-sm font-black">{levelsCompleted}/50</span>
                </div>
                <div className="border-l border-darkbg-border pl-4">
                  <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Score Total</span>
                  <span className="text-dentist-400 text-sm font-black">{totalScore}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TELA DE SELEÇÃO DE FASES */}
        {screen === "levels" && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
                Selecione uma Fase
              </h2>
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setScreen("home");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-sm"
              >
                Voltar ao Menu
              </button>
            </div>

            <LevelGrid
              highestUnlockedLevel={highestUnlockedLevel}
              unlockedLevels={unlockedLevels}
              onSelectLevel={handleStartLevel}
            />
          </div>
        )}

        {/* TELA DE GAMEPLAY ATIVA */}
        {screen === "game" && currentLevelData && currentLevelId && (
          <div className="flex flex-col w-full h-[calc(100vh-60px)] justify-between overflow-hidden">
            {/* 1. Tabuleiro (Preenche o espaço restante) */}
            <div className={`flex-1 min-h-0 w-full relative flex flex-col ${
              theme === "dark" ? "bg-slate-950" : "bg-slate-50"
            }`}>
              <CrosswordBoard
                data={currentLevelData}
                activeWord={activeWord}
                onSelectWord={setActiveWord}
                focusedCell={focusedCell}
                onFocusCell={setFocusedCell}
                inputs={inputs}
                onChangeInputs={setInputs}
                solvedWords={solvedWords}
                onWordSolved={handleWordSolved}
                onReturnLetterToPool={handleReturnLetterToPool}
                incorrectWords={incorrectWords}
                theme={theme}
              />
            </div>

            {/* 2. Dica Atual (Ponta a ponta, plano) */}
            {activeWord && (
              <div className={`w-full py-3.5 px-6 flex items-center justify-between gap-4 border-y shadow-sm transition-colors duration-200 shrink-0 ${
                theme === "dark" 
                  ? "bg-[#0d47a1] border-[#1565c0] text-sky-100" 
                  : "bg-[#bbdefb] border-[#90caf9] text-[#0d47a1]"
              }`}>
                {/* Seta Esquerda */}
                <button
                  onClick={() => handleNavigateWord("prev")}
                  className={`w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-all active:scale-90 ${
                    theme === "dark" ? "hover:bg-[#1565c0]/50" : "hover:bg-[#90caf9]/50"
                  }`}
                >
                  <span className="text-xl font-bold">◀</span>
                </button>

                <div className="flex-1 text-center max-w-xl">
                  <p className="text-sm sm:text-base font-extrabold leading-snug">
                    {activeWord.clue}
                  </p>
                </div>

                {/* Seta Direita */}
                <button
                  onClick={() => handleNavigateWord("next")}
                  className={`w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-all active:scale-90 ${
                    theme === "dark" ? "hover:bg-[#1565c0]/50" : "hover:bg-[#90caf9]/50"
                  }`}
                >
                  <span className="text-xl font-bold">▶</span>
                </button>
              </div>
            )}

            {/* 3. Rodapé com Resposta & Banco de Letras */}
            <div className={`p-4 flex flex-col gap-4 items-center shrink-0 border-t transition-colors ${
              theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-250"
            }`}>
              {/* Slots de Resposta (Preview da Palavra Ativa) */}
              {activeWord && (
                <div className="flex gap-1.5 flex-wrap justify-center w-full">
                  {activeWord.word.split("").map((_, i) => {
                    const cx = activeWord.x + (activeWord.dir === "H" ? i : 0);
                    const cy = activeWord.y + (activeWord.dir === "V" ? i : 0);
                    const cellKey = `${cx},${cy}`;
                    const val = inputs[cellKey] || "";
                    const isFocused = focusedCell && focusedCell.x === cx && focusedCell.y === cy;
                    
                    const cellInfo = currentLevelData.grid[cy]?.[cx];
                    const isCellSolved = cellInfo?.words?.some((num) => solvedWords.includes(num)) || false;

                    return (
                      <button
                        key={`slot-${i}`}
                        onClick={() => {
                          if (isCellSolved) return;
                          if (val !== "") {
                            handleReturnLetterToPool(cx, cy);
                          } else {
                            setFocusedCell({ x: cx, y: cy });
                          }
                        }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-black text-sm flex items-center justify-center border transition-all duration-150 ${
                          isCellSolved
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : isFocused
                            ? "bg-[#ffee58] border-[#fbc02d] text-slate-900 shadow-md ring-2 ring-[#ffee58]/35 scale-105"
                            : theme === "dark"
                            ? "bg-slate-800 border-slate-700 text-slate-100"
                            : "bg-white border-slate-200 text-slate-900 shadow-sm"
                        }`}
                      >
                        {val !== "" ? val : "_"}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Banco de Letras */}
              <div className="flex flex-wrap gap-2 justify-center w-full max-h-[120px] overflow-y-auto py-1">
                {poolLetters.map((letter) => {
                  const isUsed = letter.usedInCell !== null;
                  return (
                    <button
                      key={letter.id}
                      onClick={() => handleSelectLetterFromPool(letter.id)}
                      disabled={isUsed}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-black text-base flex items-center justify-center transition-all duration-150 border shrink-0 ${
                        isUsed
                          ? theme === "dark"
                            ? "bg-slate-950/40 border-slate-900 text-slate-700 opacity-20 cursor-not-allowed"
                            : "bg-slate-200/20 border-slate-200 text-slate-400 opacity-20 cursor-not-allowed"
                          : theme === "dark"
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-750 shadow-sm active:bg-[#2196f3] active:text-white"
                          : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm active:bg-[#2196f3] active:text-white"
                      }`}
                    >
                      {letter.char}
                    </button>
                  );
                })}
              </div>

              {/* Embaralhar */}
              <button
                onClick={shufflePool}
                className={`flex items-center gap-1.5 px-4 py-1.5 border rounded-lg text-xs font-black uppercase tracking-wider active:scale-95 transition-all ${
                  theme === "dark"
                    ? "bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-750"
                    : "bg-white hover:bg-slate-50 text-slate-750 border-slate-250 shadow-sm"
                }`}
              >
                🔀 Embaralhar
              </button>
            </div>
          </div>
        )}

        {/* TELA DE FIM DE FASE (VITÓRIA) */}
        {screen === "end" && currentLevelId && (
          <>
            {/* Efeito de Confetes */}
            <Confetti />

            <div className="max-w-md w-full mx-auto glass-panel p-8 rounded-3xl shadow-2xl border border-darkbg-border flex flex-col items-center gap-6 text-center animate-fade-in relative z-20">
              {/* Mascote Comemorando */}
              <div className="relative w-32 h-32 select-none animate-bounce-slow">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-dentist-500/20 blur-xl rounded-full animate-pulse" />
                <img
                  src="/mascot.png"
                  alt="Mascote Comemorando"
                  className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.35)]"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">Fase Concluída!</h2>
                <p className="text-xs text-emerald-400 mt-1 font-extrabold uppercase tracking-widest">
                  Excelente trabalho clínico!
                </p>
              </div>

              {/* Estrelas com Brilho */}
              <div className="flex gap-3">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={36}
                    className="fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse"
                  />
                ))}
              </div>

              {/* Resumo da Partida (Wordscapes/Duolingo Style) */}
              <div className="grid grid-cols-2 gap-3 w-full border-t border-b border-darkbg-border py-4">
                <div className="text-center p-2 rounded-xl bg-slate-900/40">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Tempo</span>
                  <strong className="text-slate-100 text-base font-black">
                    {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
                  </strong>
                </div>
                <div className="text-center p-2 rounded-xl bg-slate-900/40">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">XP Ganho</span>
                  <strong className="text-slate-100 text-base font-black">
                    +{Math.max(120, Math.floor((currentLevelData?.words.length || 5) * 30))}
                  </strong>
                </div>
                <div className="text-center p-2 rounded-xl bg-slate-900/40 col-span-2 flex justify-between items-center px-4 mt-1 border border-amber-500/10 bg-amber-500/5">
                  <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider">Moedas Recebidas</span>
                  <strong className="text-amber-400 text-sm font-black flex items-center gap-1">
                    🪙 +{50 + (unlockedLevels[currentLevelId]?.stars || 1) * 10}
                  </strong>
                </div>
              </div>

              {/* Barra de XP de Fim de Jogo */}
            <div className="w-full flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Nível {playerLevel}</span>
                <span>{playerXP} / {xpNeeded} XP</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 border border-darkbg-border overflow-hidden p-0.5">
                <div
                  style={{ width: `${Math.min(100, (playerXP / xpNeeded) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-dentist-600 to-dentist-400 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setScreen("home");
                }}
                className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
              >
                <Home size={16} /> Menu
              </button>
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  if (currentLevelId < 50) {
                    handleStartLevel(currentLevelId + 1);
                  } else {
                    setScreen("home");
                  }
                }}
                className="flex-1 h-12 bg-dentist-500 hover:bg-dentist-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-btn-primary"
              >
                Próxima Fase <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
      </main>

      {/* ================= MODAIS DE INTERACTION ================= */}

      {/* MODAL CONFIGURAÇÕES */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full border border-darkbg-border flex flex-col gap-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-100 flex items-center gap-2">
                <SettingsIcon size={18} /> Configurações
              </h3>
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setSettingsOpen(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-100">Efeitos Sonoros</h4>
                  <p className="text-[10px] text-slate-400">Tons de acerto, erro e digitação</p>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !sfxOn;
                    setSfxOn(nextVal);
                    soundManager.isSFXEnabled = nextVal;
                    localStorage.setItem("odontocross_settings", JSON.stringify({ musicOn, sfxOn: nextVal }));
                    soundManager.playSFX("click");
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    sfxOn ? "bg-dentist-500 text-white" : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  {sfxOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-100">Música Ambiente</h4>
                  <p className="text-[10px] text-slate-400">Trilha relaxante gerada via sintetizador</p>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !musicOn;
                    setMusicOn(nextVal);
                    soundManager.toggleMusic(nextVal && screen !== "home");
                    localStorage.setItem("odontocross_settings", JSON.stringify({ musicOn: nextVal, sfxOn }));
                    soundManager.playSFX("click");
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    musicOn ? "bg-dentist-500 text-white" : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  <Music size={18} />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playSFX("click");
                setSettingsOpen(false);
              }}
              className="w-full h-11 bg-dentist-500 hover:bg-dentist-600 text-white font-bold rounded-xl text-sm shadow-btn-primary"
            >
              Concluído
            </button>
          </div>
        </div>
      )}

      {/* MODAL PAUSA / MENU */}
      {pauseOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full border border-darkbg-border flex flex-col gap-4 text-center animate-fade-in bg-slate-900 text-slate-100 shadow-2xl">
            <div>
              <h3 className="font-extrabold text-slate-100 text-lg">Jogo Pausado</h3>
              <p className="text-xs text-slate-400">O cronômetro está parado.</p>
            </div>

            {/* Painel de Métricas e Perfil */}
            <div className="border border-slate-700/50 p-3 rounded-xl bg-slate-950/40 flex flex-col gap-2 text-left text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-450 font-bold">🪙 Moedas:</span>
                <span className="font-mono text-amber-400 font-extrabold">{coins}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-450 font-bold">⏱️ Tempo Decorrido:</span>
                <span className="font-mono text-slate-200 font-extrabold">
                  {Math.floor(timeSpent / 60).toString().padStart(2, "0")}:
                  {(timeSpent % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                  <span>Nível {playerLevel}</span>
                  <span>{playerXP} / {xpNeeded} XP</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (playerXP / xpNeeded) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-dentist-500 to-[#2196f3] rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Menu de Dicas e Ações de Ajuda (Compráveis) */}
            <div className="border border-slate-700/50 p-3 rounded-xl bg-slate-950/40 flex flex-col gap-1.5 text-left">
              <span className="text-[9px] font-black uppercase text-dentist-400 tracking-wider mb-1 block">Dicas & Ajuda</span>
              <button
                onClick={() => {
                  setPauseOpen(false);
                  handleApplyHint("letter");
                }}
                className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/60 rounded-lg text-xs font-bold text-slate-200 transition-colors"
              >
                <span>💡 Revelar Letra</span>
                <span className="font-mono text-amber-505 font-black">10 🪙</span>
              </button>
              <button
                onClick={() => {
                  setPauseOpen(false);
                  handleApplyHint("half");
                }}
                className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/60 rounded-lg text-xs font-bold text-slate-200 transition-colors"
              >
                <span>⚡ Revelar Metade</span>
                <span className="font-mono text-amber-505 font-black">30 🪙</span>
              </button>
              <button
                onClick={() => {
                  setPauseOpen(false);
                  handleApplyHint("explain");
                }}
                className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/60 rounded-lg text-xs font-bold text-slate-200 transition-colors"
              >
                <span>📖 Aula Rápida</span>
                <span className="font-mono text-amber-505 font-black">5 🪙</span>
              </button>
            </div>

            {/* Controles de Áudio Rápidos */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  const nextVal = !sfxOn;
                  setSfxOn(nextVal);
                  soundManager.isSFXEnabled = nextVal;
                  localStorage.setItem("odontocross_settings", JSON.stringify({ musicOn, sfxOn: nextVal }));
                  soundManager.playSFX("click");
                }}
                className={`flex-1 py-2 px-3 border rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
                  sfxOn 
                    ? "bg-[#2196f3] text-white border-[#2196f3]" 
                    : "bg-slate-850 border-slate-700 text-slate-400"
                }`}
              >
                {sfxOn ? <Volume2 size={14} /> : <VolumeX size={14} />} Sons
              </button>
              <button
                onClick={() => {
                  const nextVal = !musicOn;
                  setMusicOn(nextVal);
                  soundManager.toggleMusic(nextVal && screen !== "home");
                  localStorage.setItem("odontocross_settings", JSON.stringify({ musicOn: nextVal, sfxOn }));
                  soundManager.playSFX("click");
                }}
                className={`flex-1 py-2 px-3 border rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
                  musicOn 
                    ? "bg-[#2196f3] text-white border-[#2196f3]" 
                    : "bg-slate-850 border-slate-700 text-slate-400"
                }`}
              >
                <Music size={14} /> Música
              </button>
            </div>

            {/* Ações do Jogo */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setPauseOpen(false);
                }}
                className="w-full h-11 bg-dentist-500 hover:bg-dentist-600 text-white font-bold rounded-xl text-sm shadow-btn-primary"
              >
                Retomar Partida
              </button>
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setPauseOpen(false);
                  if (currentLevelId) handleStartLevel(currentLevelId);
                }}
                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={16} /> Reiniciar Fase
              </button>
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setPauseOpen(false);
                  setScreen("levels");
                }}
                className="w-full h-11 bg-slate-850 hover:bg-slate-800 text-red-400 border border-slate-700 font-bold rounded-xl text-sm"
              >
                Sair da Fase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONQUISTAS */}
      {achievementsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-xl w-full border border-darkbg-border flex flex-col gap-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-100 flex items-center gap-2">
                <Award size={18} className="text-amber-500" /> Suas Conquistas
              </h3>
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setAchievementsOpen(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <AchievementsPanel
              unlockedAchievements={unlockedAchievements}
              onClose={() => setAchievementsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL ESTATÍSTICAS DETALHADAS */}
      {statsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-xl w-full border border-darkbg-border flex flex-col gap-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-100 flex items-center gap-2">
                <BarChart2 size={18} className="text-dentist-400" /> Relatório Clínico
              </h3>
              <button
                onClick={() => {
                  soundManager.playSFX("click");
                  setStatsOpen(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <StatsPanel statistics={statistics} unlockedLevels={unlockedLevels} />
          </div>
        </div>
      )}
    </div>
  );
}
