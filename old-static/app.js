// Lógica Principal - Palavras Cruzadas Odontologia
// Autor: Antigravity

// --- CLASSES AUXILIARES E CONTROLADORES ---

class SoundController {
  constructor() {
    this.ctx = null;
    this.musicNode = null;
    this.isPlayingMusic = false;
    this.isSFXEnabled = true;
    this.musicInterval = null;
    this.progressionIdx = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  playSFX(type) {
    this.init();
    if (!this.ctx || !this.isSFXEnabled) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    
    if (type === 'click') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'correct') {
      // Arpeggio ascendente
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, t + idx * 0.06);
        noteGain.gain.setValueAtTime(0.08, t + idx * 0.06);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.18);
        noteOsc.start(t + idx * 0.06);
        noteOsc.stop(t + idx * 0.06 + 0.22);
      });
    } else if (type === 'error') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(90, t + 0.22);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (type === 'fanfare') {
      // Fanfarra triunfal
      const chords = [329.63, 392.00, 523.25, 659.25]; // Notas do acorde de Dó Maior
      chords.forEach((freq) => {
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, t);
        noteOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.45);
        noteGain.gain.setValueAtTime(0.04, t);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        noteOsc.start(t);
        noteOsc.stop(t + 0.5);
      });
    }
  }

  toggleMusic(enable) {
    this.isPlayingMusic = enable;
    if (enable) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  startAmbientMusic() {
    this.init();
    if (!this.ctx || !this.isPlayingMusic) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    if (this.musicInterval) clearInterval(this.musicInterval);
    
    this.musicInterval = setInterval(() => {
      if (!this.isPlayingMusic || !this.ctx) return;
      this.playAmbientChord();
    }, 4500);

    this.playAmbientChord();
  }

  playAmbientChord() {
    const t = this.ctx.currentTime;
    // Progressão suave relaxante (Dó Maior, Lá Menor, Fá Maior, Sol Maior)
    const progressions = [
      [261.63, 329.63, 392.00], // C
      [220.00, 261.63, 329.63], // Am
      [174.61, 261.63, 349.23], // F
      [196.00, 293.66, 392.00]  // G
    ];
    
    const freqs = progressions[this.progressionIdx];
    this.progressionIdx = (this.progressionIdx + 1) % progressions.length;

    freqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, t);
      filter.Q.setValueAtTime(0.8, t);

      // Ataque lento e fade-out relaxante
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.012, t + 1.8);
      gain.gain.setValueAtTime(0.012, t + 2.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 4.3);

      osc.start(t);
      osc.stop(t + 4.5);
    });
  }

  stopAmbientMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

// --- CONQUISTAS (ACHIEVEMENTS) ---
const AchievementsList = [
  { id: 'first_step', title: 'Primeiro Passo', desc: 'Concluiu a Fase 1 (Conceitos Básicos).', icon: '🏆', condition: (state) => state.levelsCompleted >= 1 },
  { id: 'graduando', title: 'Graduando', desc: 'Alcançou o Nível de Jogador 5.', icon: '🎓', condition: (state) => state.playerLevel >= 5 },
  { id: 'cirurgiao', title: 'Cirurgião Master', desc: 'Alcançou o Nível de Jogador 10.', icon: '👑', condition: (state) => state.playerLevel >= 10 },
  { id: 'perfect_solve', title: 'Mente Brilhante', desc: 'Concluiu uma fase com 100% de acertos sem dicas.', icon: '✨', condition: (state) => state.lastAccuracy === 100 && state.lastHintsUsed === 0 },
  { id: 'specialist', title: 'Especialista Geral', desc: 'Desbloqueou todas as especialidades (Fase 46+).', icon: '🦷', condition: (state) => state.highestUnlockedLevel >= 46 },
  { id: 'fast_solver', title: 'Veloz e Preciso', desc: 'Concluiu uma fase em menos de 2 minutos.', icon: '⚡', condition: (state) => state.lastTimeSpent <= 120 && state.lastTimeSpent > 0 },
  { id: 'scientist', title: 'Cientista', desc: 'Visualizou a explicação de 10 palavras.', icon: '📚', condition: (state) => state.totalExplanationsRead >= 10 },
  { id: 'doctor', title: 'Doutor Honoris Causa', desc: 'Concluiu todas as 50 fases de palavras cruzadas.', icon: '🏅', condition: (state) => state.levelsCompleted >= 50 }
];

// --- MOTOR DE ESTADO DO JOGO ---
const GameState = {
  // Dados de Progresso (Persistidos)
  playerLevel: 1,
  playerXP: 0,
  playerName: "Cirurgião Estudante",
  highestUnlockedLevel: 1,
  levelsCompleted: 0,
  totalScore: 0,
  unlockedLevels: {}, // id_fase: { stars: N, bestScore: N }
  unlockedAchievements: [], // array de ids
  statistics: {
    totalPlayTime: 0, // em segundos
    perfectSolves: 0,
    totalHintsUsed: 0,
    totalExplanationsRead: 0,
    averageAccuracy: 100,
    totalPhasesPlayed: 0
  },

  // Estado da Partida Ativa (Memória)
  currentLevelId: null,
  currentLevelData: null, // dados gerados pela grade (words, grid, width, height)
  activeWord: null, // palavra em foco
  focusedCell: null, // {x, y} focada
  timerInterval: null,
  timeSpent: 0,
  hintsPenaltyPoints: 0,
  hintsUsedCount: 0,
  perfectRun: true,
  theme: 'dark', // 'dark' ou 'light'

  // Auxiliares para cálculo de conquista
  lastAccuracy: 0,
  lastHintsUsed: 0,
  lastTimeSpent: 0,

  // Inicializa e carrega progresso
  loadProgress() {
    const data = localStorage.getItem('odontocruzada_save');
    if (data) {
      try {
        const saved = JSON.parse(data);
        this.playerLevel = saved.playerLevel || 1;
        this.playerXP = saved.playerXP || 0;
        this.playerName = saved.playerName || "Cirurgião Estudante";
        this.highestUnlockedLevel = saved.highestUnlockedLevel || 1;
        this.levelsCompleted = saved.levelsCompleted || 0;
        this.totalScore = saved.totalScore || 0;
        this.unlockedLevels = saved.unlockedLevels || {};
        this.unlockedAchievements = saved.unlockedAchievements || [];
        this.statistics = { ...this.statistics, ...saved.statistics };
      } catch (e) {
        console.error("Erro ao ler dados salvos:", e);
      }
    }
    const theme = localStorage.getItem('odontocruzada_theme');
    if (theme) {
      this.theme = theme;
    }
  },

  // Salva progresso
  saveProgress() {
    const data = {
      playerLevel: this.playerLevel,
      playerXP: this.playerXP,
      playerName: this.playerName,
      highestUnlockedLevel: this.highestUnlockedLevel,
      levelsCompleted: this.levelsCompleted,
      totalScore: this.totalScore,
      unlockedLevels: this.unlockedLevels,
      unlockedAchievements: this.unlockedAchievements,
      statistics: this.statistics
    };
    localStorage.setItem('odontocruzada_save', JSON.stringify(data));
    localStorage.setItem('odontocruzada_theme', this.theme);
  },

  // Retorna título de rank com base no nível
  getRankTitle() {
    if (this.playerLevel >= 15) return "Doutor em Odontologia";
    if (this.playerLevel >= 10) return "Mestre Clínico";
    if (this.playerLevel >= 7) return "Cirurgião-Dentista";
    if (this.playerLevel >= 4) return "Residente Odonto";
    return "Estudante Clínico";
  }
};

// --- CONTROLADORA DE EXECUÇÃO DO JOGO ---
const AppController = {
  sound: new SoundController(),
  generator: new CrosswordGenerator(),

  init() {
    // Carrega progresso
    GameState.loadProgress();

    // Aplica o tema inicial
    this.applyTheme(GameState.theme);

    // Renderiza telas iniciais e menus
    this.updateProfileUI();
    this.setupEventListeners();

    // Redireciona para o menu inicial
    this.showScreen('screen-home');
  },

  // Transição de telas
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Esconde o teclado virtual no menu
    if (screenId !== 'screen-game') {
      document.body.classList.remove('keyboard-open');
    }
  },

  // Atualiza Perfil e Barras de XP no Menu
  updateProfileUI() {
    document.getElementById('profile-player-name').innerText = GameState.playerName;
    document.getElementById('profile-player-level').innerText = GameState.playerLevel;
    document.getElementById('profile-player-rank').innerText = GameState.getRankTitle();
    
    const xpNeeded = this.getXPNeededForNextLevel(GameState.playerLevel);
    document.getElementById('profile-xp-text').innerText = `${GameState.playerXP} / ${xpNeeded} XP`;
    const fillPercent = Math.min(100, (GameState.playerXP / xpNeeded) * 100);
    document.getElementById('profile-xp-bar-fill').style.width = `${fillPercent}%`;

    document.getElementById('stat-completed-count').innerText = `${GameState.levelsCompleted} / 50`;
    document.getElementById('stat-total-score').innerText = GameState.totalScore;
  },

  getXPNeededForNextLevel(level) {
    return 1000 + (level - 1) * 300;
  },

  // Gerencia o Tema Claro/Escuro
  applyTheme(theme) {
    GameState.theme = theme;
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      document.getElementById('setting-theme-toggle').checked = true;
      document.getElementById('btn-toggle-theme').innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      document.body.classList.remove('theme-light');
      document.getElementById('setting-theme-toggle').checked = false;
      document.getElementById('btn-toggle-theme').innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
  },

  // Configura listeners de botões e ações
  setupEventListeners() {
    // Menu Principal
    document.getElementById('btn-home-play').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.sound.toggleMusic(document.getElementById('setting-music').checked);
      
      // Continua da fase mais alta liberada
      this.startLevel(GameState.highestUnlockedLevel);
    });

    document.getElementById('btn-home-select-level').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.sound.toggleMusic(document.getElementById('setting-music').checked);
      this.openLevelsScreen();
    });

    // Logo global (voltar para home se não estiver no meio do jogo)
    document.getElementById('btn-global-logo').addEventListener('click', () => {
      this.sound.playSFX('click');
      const gameScreen = document.getElementById('screen-game');
      if (gameScreen.classList.contains('active')) {
        this.openPauseModal();
      } else {
        this.showScreen('screen-home');
        this.updateProfileUI();
      }
    });

    // Botões globais do cabeçalho
    document.getElementById('btn-toggle-theme').addEventListener('click', () => {
      this.sound.playSFX('click');
      const newTheme = GameState.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(newTheme);
      GameState.saveProgress();
    });

    document.getElementById('btn-global-stats').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.openStatsModal();
    });

    document.getElementById('btn-global-achievements').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.openAchievementsModal();
    });

    document.getElementById('btn-global-settings').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.openSettingsModal();
    });

    // Telas internas e Modais
    document.getElementById('btn-levels-back').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.showScreen('screen-home');
      this.updateProfileUI();
    });

    // Fechar modais
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      this.sound.playSFX('click');
      document.getElementById('modal-settings').classList.remove('active');
    });

    document.getElementById('btn-close-stats').addEventListener('click', () => {
      this.sound.playSFX('click');
      document.getElementById('modal-stats-view').classList.remove('active');
    });

    document.getElementById('btn-close-achievements').addEventListener('click', () => {
      this.sound.playSFX('click');
      document.getElementById('modal-achievements-view').classList.remove('active');
    });

    // Salvar configurações
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      this.sound.playSFX('click');
      document.getElementById('modal-settings').classList.remove('active');
      this.applySettingsFromUI();
    });

    // Switch de temas na configuração
    document.getElementById('setting-theme-toggle').addEventListener('change', (e) => {
      this.applyTheme(e.target.checked ? 'light' : 'dark');
      GameState.saveProgress();
    });

    // Gameplay
    document.getElementById('btn-game-pause').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.openPauseModal();
    });

    // Botões de Dicas
    document.getElementById('btn-hint-letter').addEventListener('click', () => this.applyHint('letter'));
    document.getElementById('btn-hint-half').addEventListener('click', () => this.applyHint('half'));
    document.getElementById('btn-hint-explain').addEventListener('click', () => this.applyHint('explain'));
    document.getElementById('btn-hint-solve').addEventListener('click', () => this.applyHint('solve'));

    document.getElementById('btn-game-clear').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.clearCurrentGridInputs();
    });

    document.getElementById('btn-game-verify').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.verifyCrossword(true); // Exibe feedbacks visuais
    });

    // Modal de Pausa
    document.getElementById('btn-pause-resume').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.closePauseModal();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.closePauseModal();
      this.startLevel(GameState.currentLevelId);
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.closePauseModal();
      this.showScreen('screen-home');
      this.updateProfileUI();
    });

    // Tela de Fim de Jogo
    document.getElementById('btn-end-menu').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.showScreen('screen-home');
      this.updateProfileUI();
    });

    document.getElementById('btn-end-retry').addEventListener('click', () => {
      this.sound.playSFX('click');
      this.startLevel(GameState.currentLevelId);
    });

    document.getElementById('btn-end-next').addEventListener('click', () => {
      this.sound.playSFX('click');
      if (GameState.currentLevelId < 50) {
        this.startLevel(GameState.currentLevelId + 1);
      } else {
        this.showScreen('screen-home');
        this.updateProfileUI();
      }
    });

    // Tabs do painel de dicas gerais
    document.getElementById('tab-clues-horiz').addEventListener('click', () => {
      document.getElementById('tab-clues-horiz').classList.add('active');
      document.getElementById('tab-clues-vert').classList.remove('active');
      this.renderCluesList('H');
    });

    document.getElementById('tab-clues-vert').addEventListener('click', () => {
      document.getElementById('tab-clues-horiz').classList.remove('active');
      document.getElementById('tab-clues-vert').classList.add('active');
      this.renderCluesList('V');
    });

    // Teclado Virtual Mobile
    document.querySelectorAll('.keyboard-key').forEach(key => {
      key.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-key');
        this.handleVirtualKeyPress(val);
      });
    });

    // Teclado Físico
    window.addEventListener('keydown', (e) => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement.closest('#crossword-board')) {
        this.handlePhysicalKeyPress(e);
      }
    });
  },

  // Aplica configurações vindas dos switches
  applySettingsFromUI() {
    const musicEnabled = document.getElementById('setting-music').checked;
    const sfxEnabled = document.getElementById('setting-sfx').checked;
    
    this.sound.isSFXEnabled = sfxEnabled;
    this.sound.toggleMusic(musicEnabled);
  },

  // ABRE O MENU DE SELEÇÃO DE FASES
  openLevelsScreen() {
    this.showScreen('screen-levels');
    
    // Agrupa e cria tabs das especialidades
    const tabsContainer = document.getElementById('category-tabs-container');
    tabsContainer.innerHTML = '';

    // Extrai categorias únicas
    const categories = [];
    OdontoDatabase.forEach(lvl => {
      if (!categories.includes(lvl.category)) {
        categories.push(lvl.category);
      }
    });

    // Adiciona tab "Todas"
    const allTab = document.createElement('button');
    allTab.className = 'category-tab active';
    allTab.innerText = 'Todas';
    allTab.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      allTab.classList.add('active');
      this.filterLevelsGrid(null);
    });
    tabsContainer.appendChild(allTab);

    // Cria tabs específicas
    categories.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      tab.innerText = cat;
      tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.filterLevelsGrid(cat);
      });
      tabsContainer.appendChild(tab);
    });

    this.filterLevelsGrid(null); // Mostra todas inicialmente
  },

  // Filtra e renderiza as fases na grid
  filterLevelsGrid(categoryFilter) {
    const gridContainer = document.getElementById('levels-grid-container');
    gridContainer.innerHTML = '';

    OdontoDatabase.forEach(level => {
      if (categoryFilter && level.category !== categoryFilter) return;

      const card = document.createElement('div');
      const isLocked = level.id > GameState.highestUnlockedLevel;
      card.className = `level-card ${isLocked ? 'locked' : ''} ${level.id === GameState.highestUnlockedLevel ? 'active' : ''}`;

      const levelInfo = GameState.unlockedLevels[level.id] || { stars: 0, bestScore: 0 };

      // Gera as estrelas ganhas
      let starsHTML = '';
      for (let s = 1; s <= 3; s++) {
        starsHTML += `<i class="fa-solid fa-star ${s <= levelInfo.stars ? 'star-filled' : ''}"></i>`;
      }

      card.innerHTML = `
        <div class="level-badge">${level.id}</div>
        <div class="level-title">${level.title}</div>
        <div class="level-category">${level.category}</div>
        <div class="level-stars">${isLocked ? '' : starsHTML}</div>
        ${levelInfo.bestScore > 0 ? `<span class="level-score">Melhor: ${levelInfo.bestScore} pts</span>` : ''}
        ${isLocked ? `<div class="lock-overlay"><i class="fa-solid fa-lock"></i></div>` : ''}
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          this.sound.playSFX('click');
          this.startLevel(level.id);
        });
      }

      gridContainer.appendChild(card);
    });
  },

  // INICIA UMA FASE
  startLevel(levelId) {
    // Para timers anteriores
    if (GameState.timerInterval) clearInterval(GameState.timerInterval);

    // Carrega dados da fase
    const level = OdontoDatabase.find(l => l.id === levelId);
    if (!level) return;

    GameState.currentLevelId = levelId;
    GameState.timeSpent = 0;
    GameState.hintsPenaltyPoints = 0;
    GameState.hintsUsedCount = 0;
    GameState.perfectRun = true;
    GameState.activeWord = null;
    GameState.focusedCell = null;

    // Oculta explicações anteriores
    document.getElementById('game-educational-card').classList.remove('active');

    // Tenta gerar a grade procedural
    const generated = this.generator.generate(level.words);
    if (!generated) {
      alert("Erro ao construir grade procedural desta fase. Tentando gerar com lista simplificada...");
      return;
    }

    GameState.currentLevelData = generated;

    // Atualiza cabeçalhos
    document.getElementById('game-level-category').innerText = level.category;
    document.getElementById('game-level-title').innerText = `${levelId}. ${level.title}`;
    document.getElementById('game-score').innerText = '0';
    document.getElementById('game-timer').innerText = '00:00';

    // Limpa estrelas antigas
    document.getElementById('game-stars-bar').innerHTML = `
      <i class="fa-solid fa-star star-filled" id="game-star-indicator-1"></i>
      <i class="fa-solid fa-star star-filled" id="game-star-indicator-2"></i>
      <i class="fa-solid fa-star star-filled" id="game-star-indicator-3"></i>
    `;

    // Renderiza tabuleiro
    this.renderGameBoard(generated);

    // Inicializa dicas gerais
    document.getElementById('tab-clues-horiz').classList.add('active');
    document.getElementById('tab-clues-vert').classList.remove('active');
    this.renderCluesList('H');

    // Inicia timer
    GameState.timerInterval = setInterval(() => {
      GameState.timeSpent++;
      
      // Atualiza timer formatado
      const minutes = Math.floor(GameState.timeSpent / 60).toString().padStart(2, '0');
      const seconds = (GameState.timeSpent % 60).toString().padStart(2, '0');
      document.getElementById('game-timer').innerText = `${minutes}:${seconds}`;

      // A cada 1 segundo atualiza as estrelas estimadas
      this.updateRealTimeStars();
    }, 1000);

    // Redireciona para tela de jogo
    this.showScreen('screen-game');

    // Seleciona a primeira palavra
    if (generated.words.length > 0) {
      this.selectWord(generated.words[0]);
      // Foca na primeira célula
      const firstCellInput = document.querySelector(`.grid-cell[data-x="${generated.words[0].x}"][data-y="${generated.words[0].y}"] input`);
      if (firstCellInput) firstCellInput.focus();
    }
  },

  // Renderiza a tabela da grade de palavras cruzadas
  renderGameBoard(data) {
    const board = document.getElementById('crossword-board');
    board.innerHTML = '';
    
    // Configura layout de colunas no CSS Grid dinamicamente
    board.style.gridTemplateColumns = `repeat(${data.width}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${data.height}, 1fr)`;

    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const cellInfo = data.grid[y][x];
        const cellDiv = document.createElement('div');
        
        if (cellInfo === null) {
          // Espaço vazio/preto
          cellDiv.className = 'grid-cell';
        } else {
          // Célula jogável
          cellDiv.className = 'grid-cell active-letter';
          cellDiv.setAttribute('data-x', x);
          cellDiv.setAttribute('data-y', y);

          // Numeração inicial no canto superior se houver
          if (cellInfo.number) {
            const numSpan = document.createElement('span');
            numSpan.className = 'cell-number';
            numSpan.innerText = cellInfo.number;
            cellDiv.appendChild(numSpan);
          }

          // Input de entrada de caractere
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.setAttribute('autocomplete', 'off');
          input.setAttribute('inputmode', 'none');
          
          // Previne digitação padrão para gerenciar fluxo customizado
          input.addEventListener('beforeinput', (e) => {
            e.preventDefault();
          });

          // Focus event
          input.addEventListener('focus', () => {
            GameState.focusedCell = { x, y };
            // Encontra a palavra correspondente na direção atual
            let bestWord = null;
            if (GameState.activeWord && cellInfo.words.includes(GameState.activeWord.number)) {
              bestWord = GameState.activeWord;
            } else {
              // Pega a primeira palavra da lista que cruza a célula
              const wordNum = cellInfo.words[0];
              bestWord = data.words.find(w => w.number === wordNum);
            }
            if (bestWord) {
              this.selectWord(bestWord);
            }
          });

          // Click para alternar direção caso esteja em um cruzamento
          input.addEventListener('click', () => {
            if (cellInfo.words.length > 1 && GameState.activeWord) {
              // Se já está selecionado e é interseção, rotaciona a palavra ativa
              const otherWordNum = cellInfo.words.find(n => n !== GameState.activeWord.number);
              const otherWord = data.words.find(w => w.number === otherWordNum);
              if (otherWord) {
                this.selectWord(otherWord);
              }
            }
          });

          cellDiv.appendChild(input);
        }

        board.appendChild(cellDiv);
      }
    }

    // Configura detecção de mobile para ativar o teclado virtual
    this.detectDeviceForKeyboard();
  },

  // Seleciona uma palavra, colorindo o tabuleiro e atualizando a dica ativa
  selectWord(wordObj) {
    if (!wordObj) return;
    GameState.activeWord = wordObj;

    // Limpa seleções anteriores do grid
    document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('selected', 'focused'));

    // Highlight nas células da palavra selecionada
    const len = wordObj.word.length;
    for (let i = 0; i < len; i++) {
      const cx = wordObj.x + (wordObj.dir === 'H' ? i : 0);
      const cy = wordObj.y + (wordObj.dir === 'V' ? i : 0);
      const cellDiv = document.querySelector(`.grid-cell[data-x="${cx}"][data-y="${cy}"]`);
      if (cellDiv) {
        cellDiv.classList.add('selected');
        // Se a célula ativa atual for esta, aplica borda cheia
        if (GameState.focusedCell && GameState.focusedCell.x === cx && GameState.focusedCell.y === cy) {
          cellDiv.classList.add('focused');
        }
      }
    }

    // Atualiza a dica no topo do painel
    document.getElementById('active-clue-label').innerText = `${wordObj.number} ${wordObj.dir === 'H' ? 'Horizontal' : 'Vertical'}`;
    document.getElementById('active-clue-text').innerText = wordObj.clue;

    // Atualiza o scroll do painel lateral de dicas para focar o item correto
    const currentTabDir = document.getElementById('tab-clues-horiz').classList.contains('active') ? 'H' : 'V';
    if (currentTabDir !== wordObj.dir) {
      // Alterna aba se necessário
      if (wordObj.dir === 'H') {
        document.getElementById('tab-clues-horiz').click();
      } else {
        document.getElementById('tab-clues-vert').click();
      }
    } else {
      // Apenas atualiza a seleção visual da lista
      document.querySelectorAll('.clue-item').forEach(el => {
        el.classList.remove('selected');
        if (parseInt(el.getAttribute('data-number')) === wordObj.number) {
          el.classList.add('selected');
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    }

    // Oculta o card de explicação até que o usuário clique em "Explicação"
    document.getElementById('game-educational-card').classList.remove('active');
  },

  // Renderiza a lista de dicas lateral (Horizontais ou Verticais)
  renderCluesList(direction) {
    const container = document.getElementById('clues-scroll-container');
    container.innerHTML = '';
    
    if (!GameState.currentLevelData) return;

    const filtered = GameState.currentLevelData.words.filter(w => w.dir === direction);

    filtered.forEach(w => {
      const div = document.createElement('div');
      div.className = 'clue-item';
      div.setAttribute('data-number', w.number);
      if (GameState.activeWord && GameState.activeWord.number === w.number) {
        div.className += ' selected';
      }

      div.innerHTML = `
        <div class="clue-number">${w.number}</div>
        <div class="clue-text">${w.clue}</div>
      `;

      div.addEventListener('click', () => {
        this.sound.playSFX('click');
        this.selectWord(w);
        
        // Coloca foco na primeira célula vazia da palavra selecionada
        const firstEmptyCell = this.getFirstEmptyCellOfWord(w);
        const cellToFocus = firstEmptyCell || { x: w.x, y: w.y };
        const input = document.querySelector(`.grid-cell[data-x="${cellToFocus.x}"][data-y="${cellToFocus.y}"] input`);
        if (input) input.focus();
      });

      container.appendChild(div);
    });
  },

  // Retorna a primeira célula vazia de uma palavra
  getFirstEmptyCellOfWord(wordObj) {
    const len = wordObj.word.length;
    for (let i = 0; i < len; i++) {
      const cx = wordObj.x + (wordObj.dir === 'H' ? i : 0);
      const cy = wordObj.y + (wordObj.dir === 'V' ? i : 0);
      const input = document.querySelector(`.grid-cell[data-x="${cx}"][data-y="${cy}"] input`);
      if (input && input.value.trim() === '') {
        return { x: cx, y: cy };
      }
    }
    return null;
  },

  // Gerenciamento de pressionamento de teclas no tabuleiro (Teclado Físico)
  handlePhysicalKeyPress(e) {
    if (!GameState.activeWord || !GameState.focusedCell) return;
    
    const key = e.key.toUpperCase();
    const { x, y } = GameState.focusedCell;
    const currentInput = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"] input`);

    // Tecla Backspace (Apagar)
    if (e.key === 'Backspace') {
      this.sound.playSFX('click');
      if (currentInput.value !== '') {
        currentInput.value = '';
        currentInput.closest('.grid-cell').classList.remove('error', 'correct');
      } else {
        // Move para a célula anterior
        const prev = this.getAdjacentCellCoords(x, y, GameState.activeWord.dir, -1);
        if (prev) {
          const prevInput = document.querySelector(`.grid-cell[data-x="${prev.x}"][data-y="${prev.y}"] input`);
          if (prevInput) {
            prevInput.value = '';
            prevInput.closest('.grid-cell').classList.remove('error', 'correct');
            prevInput.focus();
          }
        }
      }
      return;
    }

    // Tecla Enter (Verifica ou Pula)
    if (e.key === 'Enter') {
      this.sound.playSFX('click');
      this.moveFocusNextWord();
      return;
    }

    // Navegação via Setas
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      let targetCoords = null;
      if (e.key === 'ArrowUp') targetCoords = { x, y: y - 1 };
      if (e.key === 'ArrowDown') targetCoords = { x, y: y + 1 };
      if (e.key === 'ArrowLeft') targetCoords = { x: x - 1, y };
      if (e.key === 'ArrowRight') targetCoords = { x: x + 1, y };

      if (targetCoords) {
        const nextInput = document.querySelector(`.grid-cell[data-x="${targetCoords.x}"][data-y="${targetCoords.y}"] input`);
        if (nextInput) nextInput.focus();
      }
      return;
    }

    // Caracteres Alfanuméricos (Letras A-Z)
    if (/^[A-Z\u00C0-\u00FF]$/.test(key)) {
      this.sound.playSFX('click');
      currentInput.value = key;
      currentInput.closest('.grid-cell').classList.remove('error', 'correct');

      // Move para a próxima célula
      const next = this.getAdjacentCellCoords(x, y, GameState.activeWord.dir, 1);
      if (next) {
        const nextInput = document.querySelector(`.grid-cell[data-x="${next.x}"][data-y="${next.y}"] input`);
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  },

  // Gerencia teclas clicadas no Teclado Virtual Mobile
  handleVirtualKeyPress(val) {
    if (!GameState.activeWord || !GameState.focusedCell) return;
    const { x, y } = GameState.focusedCell;
    const currentInput = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"] input`);

    if (val === 'BACKSPACE') {
      this.sound.playSFX('click');
      if (currentInput.value !== '') {
        currentInput.value = '';
        currentInput.closest('.grid-cell').classList.remove('error', 'correct');
      } else {
        const prev = this.getAdjacentCellCoords(x, y, GameState.activeWord.dir, -1);
        if (prev) {
          const prevInput = document.querySelector(`.grid-cell[data-x="${prev.x}"][data-y="${prev.y}"] input`);
          if (prevInput) {
            prevInput.value = '';
            prevInput.closest('.grid-cell').classList.remove('error', 'correct');
            prevInput.focus();
          }
        }
      }
    } else if (val === 'ENTER') {
      this.sound.playSFX('click');
      this.moveFocusNextWord();
    } else {
      // Letras A-Z
      this.sound.playSFX('click');
      currentInput.value = val;
      currentInput.closest('.grid-cell').classList.remove('error', 'correct');

      const next = this.getAdjacentCellCoords(x, y, GameState.activeWord.dir, 1);
      if (next) {
        const nextInput = document.querySelector(`.grid-cell[data-x="${next.x}"][data-y="${next.y}"] input`);
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  },

  // Retorna coordenadas adjacentes no fluxo da palavra (+1 avançar, -1 retroceder)
  getAdjacentCellCoords(x, y, direction, offset) {
    const nx = x + (direction === 'H' ? offset : 0);
    const ny = y + (direction === 'V' ? offset : 0);

    // Valida se está dentro do limite da palavra atual
    const word = GameState.activeWord;
    if (!word) return null;

    const idx = direction === 'H' ? (nx - word.x) : (ny - word.y);
    if (idx >= 0 && idx < word.word.length) {
      return { x: nx, y: ny };
    }
    return null;
  },

  // Pula foco para a próxima palavra da lista
  moveFocusNextWord() {
    if (!GameState.activeWord || !GameState.currentLevelData) return;
    const currentNum = GameState.activeWord.number;
    const allWords = GameState.currentLevelData.words;
    
    // Encontra índice atual
    const idx = allWords.findIndex(w => w.number === currentNum);
    const nextIdx = (idx + 1) % allWords.length;
    const nextWord = allWords[nextIdx];

    this.selectWord(nextWord);
    
    // Foca na primeira célula vazia
    const emptyCell = this.getFirstEmptyCellOfWord(nextWord);
    const cellToFocus = emptyCell || { x: nextWord.x, y: nextWord.y };
    const input = document.querySelector(`.grid-cell[data-x="${cellToFocus.x}"][data-y="${cellToFocus.y}"] input`);
    if (input) input.focus();
  },

  // Limpa todas as entradas digitadas do tabuleiro
  clearCurrentGridInputs() {
    document.querySelectorAll('.grid-cell.active-letter').forEach(cell => {
      const input = cell.querySelector('input');
      if (input) {
        input.value = '';
      }
      cell.classList.remove('error', 'correct');
    });

    if (GameState.activeWord) {
      this.selectWord(GameState.activeWord);
    }
  },

  // Detecta se dispositivo é mobile/tablet para abrir teclado customizado
  detectDeviceForKeyboard() {
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    if (isMobile) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
  },

  // ================= SISTEMA DE DICAS =================

  applyHint(type) {
    if (!GameState.activeWord || !GameState.currentLevelData) return;
    
    const wordObj = GameState.activeWord;
    const targetWordNormalized = this.generator.normalize(wordObj.word);

    if (type === 'letter') {
      // DICA 1: Revela 1 letra na célula focada
      if (!GameState.focusedCell) return;
      const { x, y } = GameState.focusedCell;

      // Garante que a célula focada faz parte da palavra selecionada
      const cellInfo = GameState.currentLevelData.grid[y][x];
      if (!cellInfo || !cellInfo.words.includes(wordObj.number)) return;

      const charOffset = wordObj.dir === 'H' ? (x - wordObj.x) : (y - wordObj.y);
      const correctChar = targetWordNormalized[charOffset];

      const input = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"] input`);
      if (input && input.value !== correctChar) {
        this.sound.playSFX('click');
        input.value = correctChar;
        input.closest('.grid-cell').classList.add('correct');
        input.closest('.grid-cell').classList.remove('error');
        
        GameState.hintsPenaltyPoints += 10;
        GameState.hintsUsedCount++;
        GameState.perfectRun = false;
        
        this.verifyCrossword(false); // checagem interna sem alarde
      }
    }
    else if (type === 'half') {
      // DICA 2: Revela metade da palavra (todas as letras ímpares ou pares)
      this.sound.playSFX('click');
      let revealedCount = 0;
      
      for (let i = 0; i < wordObj.word.length; i++) {
        // Revela as posições pares (0, 2, 4...)
        if (i % 2 === 0) {
          const cx = wordObj.x + (wordObj.dir === 'H' ? i : 0);
          const cy = wordObj.y + (wordObj.dir === 'V' ? i : 0);
          
          const input = document.querySelector(`.grid-cell[data-x="${cx}"][data-y="${cy}"] input`);
          const correctChar = targetWordNormalized[i];
          
          if (input && input.value !== correctChar) {
            input.value = correctChar;
            input.closest('.grid-cell').classList.add('correct');
            input.closest('.grid-cell').classList.remove('error');
            revealedCount++;
          }
        }
      }

      if (revealedCount > 0) {
        GameState.hintsPenaltyPoints += 30;
        GameState.hintsUsedCount++;
        GameState.perfectRun = false;
        
        this.verifyCrossword(false);
      }
    }
    else if (type === 'explain') {
      // DICA 3: Exibe a explicação científica detalhada daquela palavra
      this.sound.playSFX('click');
      const eduCard = document.getElementById('game-educational-card');
      const eduText = document.getElementById('game-educational-text');

      eduText.innerText = wordObj.explanation;
      eduCard.classList.add('active');

      GameState.hintsPenaltyPoints += 5; // Penalidade leve para incentivar a leitura do conteúdo educacional
      GameState.hintsUsedCount++;
      GameState.statistics.totalExplanationsRead++;

      document.getElementById('game-score').innerText = this.calculateCurrentEstimateScore();
      
      // Salva progresso da leitura para a conquista "Cientista"
      this.checkAchievementsUnlocked();
      GameState.saveProgress();
    }
    else if (type === 'solve') {
      // DICA 4: Resolve a palavra inteira na grade
      this.sound.playSFX('click');
      let solvedCount = 0;

      for (let i = 0; i < wordObj.word.length; i++) {
        const cx = wordObj.x + (wordObj.dir === 'H' ? i : 0);
        const cy = wordObj.y + (wordObj.dir === 'V' ? i : 0);
        
        const input = document.querySelector(`.grid-cell[data-x="${cx}"][data-y="${cy}"] input`);
        const correctChar = targetWordNormalized[i];
        
        if (input && input.value !== correctChar) {
          input.value = correctChar;
          input.closest('.grid-cell').classList.add('correct');
          input.closest('.grid-cell').classList.remove('error');
          solvedCount++;
        }
      }

      if (solvedCount > 0) {
        GameState.hintsPenaltyPoints += 50;
        GameState.hintsUsedCount++;
        GameState.perfectRun = false;
        
        this.verifyCrossword(false);
      }
    }
  },

  // Calcula a estimativa atual da pontuação descontando penalidades
  calculateCurrentEstimateScore() {
    if (!GameState.currentLevelData) return 0;
    const base = GameState.currentLevelData.words.length * 100;
    return Math.max(0, base - GameState.hintsPenaltyPoints);
  },

  // ================= VERIFICAÇÃO E CONCLUSÃO DE FASE =================

  // Verifica o estado atual das letras preenchidas na grade
  verifyCrossword(showFeedback = true) {
    if (!GameState.currentLevelData) return false;

    const data = GameState.currentLevelData;
    let totalCells = 0;
    let correctCells = 0;
    let emptyCellsFound = false;
    let errorCellsFound = false;

    // Varre cada célula da grade recortada
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const cell = data.grid[y][x];
        if (cell === null) continue;

        totalCells++;
        const cellDiv = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
        const input = cellDiv.querySelector('input');
        const typed = input.value.trim().toUpperCase();
        const expected = cell.char;

        if (typed === '') {
          emptyCellsFound = true;
          cellDiv.classList.remove('correct', 'error');
        } else if (typed === expected) {
          correctCells++;
          if (showFeedback) {
            cellDiv.classList.add('correct');
            cellDiv.classList.remove('error');
          }
        } else {
          errorCellsFound = true;
          if (showFeedback) {
            cellDiv.classList.add('error');
            cellDiv.classList.remove('correct');
          }
        }
      }
    }

    if (showFeedback) {
      if (errorCellsFound) {
        this.sound.playSFX('error');
        // Efeito tremor de erro na grade
        document.getElementById('crossword-board').classList.add('error-shake');
        setTimeout(() => {
          document.getElementById('crossword-board').classList.remove('error-shake');
        }, 500);
      } else if (!emptyCellsFound && correctCells === totalCells) {
        // Sucesso Total! Fase concluída
        this.completeLevel();
        return true;
      } else {
        // Acertos parciais sem erros
        this.sound.playSFX('click');
      }
    }

    // Atualiza pontuação estimada na tela
    const currentScore = this.calculateCurrentEstimateScore();
    document.getElementById('game-score').innerText = currentScore;

    return !emptyCellsFound && !errorCellsFound;
  },

  // Calcula estrelas em tempo real baseado nas penalidades
  updateRealTimeStars() {
    if (!GameState.currentLevelData) return;
    const maxScore = GameState.currentLevelData.words.length * 100;
    const currentScore = this.calculateCurrentEstimateScore();

    let starsCount = 1;
    if (currentScore >= maxScore * 0.9) starsCount = 3;
    else if (currentScore >= maxScore * 0.6) starsCount = 2;

    // Atualiza as estrelas visuais
    const starsBar = document.getElementById('game-stars-bar');
    starsBar.innerHTML = '';
    for (let s = 1; s <= 3; s++) {
      starsBar.innerHTML += `<i class="fa-solid fa-star ${s <= starsCount ? 'star-filled' : ''}"></i>`;
    }
  },

  // FINALIZA E DÁ SUCESSO À FASE
  completeLevel() {
    clearInterval(GameState.timerInterval);
    this.sound.playSFX('fanfare');

    const levelId = GameState.currentLevelId;
    const totalWords = GameState.currentLevelData.words.length;
    const baseScore = totalWords * 100;

    // Penalidade por dicas
    const finalScoreEstimate = Math.max(0, baseScore - GameState.hintsPenaltyPoints);

    // Bônus de Tempo: Conclusão em menos de 10 minutos (600s)
    let timeBonus = 0;
    if (GameState.timeSpent < 600) {
      timeBonus = Math.floor((600 - GameState.timeSpent) * 1.5);
    }

    // Bônus por Conclusão Perfeita (Sem nenhuma dica prejudicial de letras)
    let perfectBonus = 0;
    if (GameState.perfectRun && GameState.hintsUsedCount === 0) {
      perfectBonus = 500;
    }

    const finalScore = finalScoreEstimate + timeBonus + perfectBonus;

    // Calcula Precisão das Células
    let totalCells = 0;
    let correctCellsFirstTry = 0;
    
    // Na conclusão tudo está correto, então precisão será afetada pelas dicas/erros
    const precision = Math.max(10, Math.floor(100 - (GameState.hintsUsedCount * 8)));

    // Estrelas Ganhas
    let starsWon = 1;
    if (finalScoreEstimate >= baseScore * 0.88) starsWon = 3;
    else if (finalScoreEstimate >= baseScore * 0.58) starsWon = 2;

    // Ganho de XP
    const xpGained = Math.max(120, Math.floor(finalScore / 3));

    // Salva recorde local da fase
    const previousRecord = GameState.unlockedLevels[levelId] || { stars: 0, bestScore: 0 };
    const newBestScore = Math.max(previousRecord.bestScore, finalScore);
    const newStars = Math.max(previousRecord.stars, starsWon);

    GameState.unlockedLevels[levelId] = {
      stars: newStars,
      bestScore: newBestScore
    };

    // Atualiza desbloqueio da próxima fase
    if (levelId === GameState.highestUnlockedLevel && levelId < 50) {
      GameState.highestUnlockedLevel = levelId + 1;
    }

    // Incrementa estatísticas gerais
    if (previousRecord.bestScore === 0) {
      GameState.levelsCompleted++;
    }
    GameState.totalScore += (newBestScore - previousRecord.bestScore);
    GameState.statistics.totalPhasesPlayed++;
    GameState.statistics.totalPlayTime += GameState.timeSpent;
    GameState.statistics.totalHintsUsed += GameState.hintsUsedCount;
    if (perfectBonus > 0) GameState.statistics.perfectSolves++;

    // Salva variáveis para verificação de conquistas
    GameState.lastAccuracy = precision;
    GameState.lastHintsUsed = GameState.hintsUsedCount;
    GameState.lastTimeSpent = GameState.timeSpent;

    // Processa XP do jogador e verifica subida de nível
    const oldLevel = GameState.playerLevel;
    GameState.playerXP += xpGained;
    
    let xpNeeded = this.getXPNeededForNextLevel(GameState.playerLevel);
    let leveledUp = false;

    while (GameState.playerXP >= xpNeeded && GameState.playerLevel < 20) {
      GameState.playerXP -= xpNeeded;
      GameState.playerLevel++;
      xpNeeded = this.getXPNeededForNextLevel(GameState.playerLevel);
      leveledUp = true;
    }

    // Verifica e concede novas conquistas destravadas
    this.checkAchievementsUnlocked();

    // Salva os dados permanentemente
    GameState.saveProgress();

    // Renderiza a tela de encerramento da fase
    this.renderLevelEndScreen(finalScore, GameState.timeSpent, precision, GameState.hintsUsedCount, starsWon, xpGained, leveledUp);
  },

  // Renderiza a interface da tela final de sucesso
  renderLevelEndScreen(score, timeSeconds, precision, hintsUsed, starsCount, xpEarned, leveledUp) {
    document.getElementById('end-score').innerText = score;
    
    // Formata tempo
    const mins = Math.floor(timeSeconds / 60).toString().padStart(2, '0');
    const secs = (timeSeconds % 60).toString().padStart(2, '0');
    document.getElementById('end-time').innerText = `${mins}:${secs}`;
    
    document.getElementById('end-accuracy').innerText = `${precision}%`;
    document.getElementById('end-hints').innerText = hintsUsed;
    document.getElementById('end-xp-earned').innerText = `+${xpEarned} XP`;
    document.getElementById('end-level-text').innerText = `Nível ${GameState.playerLevel}`;

    // Estrelas Visuais
    document.querySelectorAll('.end-star-icon').forEach(s => s.classList.remove('active'));
    setTimeout(() => { if (starsCount >= 1) document.getElementById('end-star-1').classList.add('active'); }, 300);
    setTimeout(() => { if (starsCount >= 2) document.getElementById('end-star-2').classList.add('active'); }, 600);
    setTimeout(() => { if (starsCount >= 3) document.getElementById('end-star-3').classList.add('active'); }, 900);

    // Ajusta barra de XP final
    const xpNeeded = this.getXPNeededForNextLevel(GameState.playerLevel);
    const xpPercent = Math.min(100, (GameState.playerXP / xpNeeded) * 100);
    document.getElementById('end-xp-bar-fill').style.width = `${xpPercent}%`;

    // Alerta de Novo Nível (Level-up)
    const levelUpAlert = document.getElementById('end-level-up-alert');
    if (leveledUp) {
      levelUpAlert.style.display = 'block';
    } else {
      levelUpAlert.style.display = 'none';
    }

    // Configura botão de próxima fase
    const nextBtn = document.getElementById('btn-end-next');
    if (GameState.currentLevelId >= 50) {
      nextBtn.innerHTML = 'Fim do Jogo <i class="fa-solid fa-flag-checkered"></i>';
    } else {
      nextBtn.innerHTML = 'Próxima Fase <i class="fa-solid fa-arrow-right"></i>';
    }

    // Mostra tela final
    this.showScreen('screen-end');
  },

  // ================= SISTEMA DE CONQUISTAS (ACHIEVEMENTS) =================

  // Checa e ativa conquistas desbloqueadas
  checkAchievementsUnlocked() {
    AchievementsList.forEach(ach => {
      // Se não está desbloqueado ainda e cumpre o requisito
      if (!GameState.unlockedAchievements.includes(ach.id) && ach.condition(GameState)) {
        GameState.unlockedAchievements.push(ach.id);
        
        // Exibe toast de notificação em tempo real
        this.showAchievementToast(ach);
      }
    });
  },

  // Renderiza caixa flutuante temporária de conquista ganha
  showAchievementToast(achievement) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    toast.innerHTML = `
      <div class="toast-icon">${achievement.icon}</div>
      <div class="toast-content">
        <h5>Conquista Desbloqueada!</h5>
        <p>${achievement.title}</p>
      </div>
    `;

    container.appendChild(toast);

    // Toca som de acerto sutil
    this.sound.playSFX('correct');

    // Remove elemento após animação completa (4 segundos total)
    setTimeout(() => {
      toast.remove();
    }, 4000);
  },

  // ================= ABERTURA DE MODAIS DE INTERFACE =================

  openSettingsModal() {
    document.getElementById('modal-settings').classList.add('active');
  },

  openPauseModal() {
    if (GameState.timerInterval) clearInterval(GameState.timerInterval);
    document.getElementById('modal-pause').classList.add('active');
  },

  closePauseModal() {
    document.getElementById('modal-pause').classList.remove('active');
    
    // Retoma o timer do jogo
    if (GameState.currentLevelData && document.getElementById('screen-game').classList.contains('active')) {
      GameState.timerInterval = setInterval(() => {
        GameState.timeSpent++;
        const minutes = Math.floor(GameState.timeSpent / 60).toString().padStart(2, '0');
        const seconds = (GameState.timeSpent % 60).toString().padStart(2, '0');
        document.getElementById('game-timer').innerText = `${minutes}:${seconds}`;
        this.updateRealTimeStars();
      }, 1000);
    }
  },

  openStatsModal() {
    // Calcula tempo em minutos formatados
    const totalMinutes = Math.floor(GameState.statistics.totalPlayTime / 60);
    const totalSecs = GameState.statistics.totalPlayTime % 60;
    document.getElementById('detail-stat-time').innerText = `${totalMinutes}m ${totalSecs}s`;
    
    document.getElementById('detail-stat-perfect').innerText = GameState.statistics.perfectSolves;
    document.getElementById('detail-stat-hints').innerText = GameState.statistics.totalHintsUsed;

    // Calcula precisão média
    let accuracySum = 100;
    if (GameState.statistics.totalPhasesPlayed > 0) {
      accuracySum = Math.max(10, Math.floor(100 - (GameState.statistics.totalHintsUsed * 6 / GameState.statistics.totalPhasesPlayed)));
    }
    document.getElementById('detail-stat-accuracy').innerText = `${accuracySum}%`;

    // Renderiza a lista detalhada por categoria
    const tbody = document.getElementById('stats-history-tbody');
    tbody.innerHTML = '';

    // Agrupa o progresso real por especialidade
    const categoriesMap = {};
    OdontoDatabase.forEach(lvl => {
      if (!categoriesMap[lvl.category]) {
        categoriesMap[lvl.category] = { total: 0, completed: 0, bestScore: 0 };
      }
      categoriesMap[lvl.category].total++;
      
      const record = GameState.unlockedLevels[lvl.id];
      if (record && record.bestScore > 0) {
        categoriesMap[lvl.category].completed++;
        categoriesMap[lvl.category].bestScore = Math.max(categoriesMap[lvl.category].bestScore, record.bestScore);
      }
    });

    Object.keys(categoriesMap).forEach(cat => {
      const info = categoriesMap[cat];
      const tr = document.createElement('tr');
      const progressPercent = Math.round((info.completed / info.total) * 100);

      tr.innerHTML = `
        <td><strong>${cat}</strong></td>
        <td>${info.completed} / ${info.total}</td>
        <td>${progressPercent}%</td>
        <td>${info.bestScore} pts</td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById('modal-stats-view').classList.add('active');
  },

  openAchievementsModal() {
    const container = document.getElementById('achievements-grid-container');
    container.innerHTML = '';

    AchievementsList.forEach(ach => {
      const isUnlocked = GameState.unlockedAchievements.includes(ach.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;

      card.innerHTML = `
        <div class="achievement-icon">${isUnlocked ? achievementIcon(ach.id) : '🔒'}</div>
        <div class="achievement-details">
          <h4>${ach.title}</h4>
          <p>${ach.desc}</p>
          ${isUnlocked ? `<span class="achievement-date">Desbloqueada</span>` : ''}
        </div>
      `;
      container.appendChild(card);
    });

    function achievementIcon(id) {
      const found = AchievementsList.find(a => a.id === id);
      return found ? found.icon : '🏆';
    }

    document.getElementById('modal-achievements-view').classList.add('active');
  }
};

// Inicialização imediata ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  AppController.init();
});
