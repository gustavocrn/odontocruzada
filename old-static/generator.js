// Gerador Procedural de Palavras Cruzadas para Odontologia
// Autor: Antigravity

class CrosswordGenerator {
  constructor(maxSize = 30) {
    this.maxSize = maxSize;
  }

  // Remove acentos e caracteres especiais para a lógica de grade
  normalize(word) {
    return word.normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .toUpperCase()
               .replace(/[^A-Z]/g, "");
  }

  // Embaralha um array
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Gera a grade de palavras cruzadas
  generate(wordList) {
    if (!wordList || wordList.length === 0) return null;

    // Normaliza e prepara as palavras
    const preparedWords = wordList.map((w, index) => ({
      original: w.word,
      word: this.normalize(w.word),
      clue: w.clue,
      explanation: w.explanation,
      originalIndex: index
    })).filter(w => w.word.length >= 2);

    // Ordena por tamanho decrescente
    const sortedWords = [...preparedWords].sort((a, b) => b.word.length - a.word.length);

    let bestResult = null;
    let bestPlacedCount = -1;

    // Executa várias tentativas para encontrar a melhor conexão e compactação
    const totalAttempts = 20;
    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      // Para tentativas subsequentes, mantém a maior palavra no início e embaralha o resto
      let wordsToPlace = [...sortedWords];
      if (attempt > 0) {
        const first = wordsToPlace[0];
        const rest = this.shuffle(wordsToPlace.slice(1));
        wordsToPlace = [first, ...rest];
      }

      const result = this.tryBuildGrid(wordsToPlace);
      if (result && result.placedWords.length > bestPlacedCount) {
        bestPlacedCount = result.placedWords.length;
        bestResult = result;

        // Se conseguiu colocar todas as palavras, terminamos mais cedo
        if (bestPlacedCount === sortedWords.length) {
          break;
        }
      }
    }

    if (!bestResult) return null;

    // Aplica o corte da grade ao redor das palavras colocadas
    return this.cropAndNumberGrid(bestResult);
  }

  // Tenta construir a grade com a lista ordenada fornecida
  tryBuildGrid(words) {
    // Inicializa a grade virtual (limpa)
    const size = this.maxSize;
    const grid = Array(size).fill(null).map(() => Array(size).fill(null));
    const placedWords = [];

    // Coloca a primeira palavra (a maior) no centro horizontalmente
    const firstWordObj = words[0];
    const startX = Math.floor((size - firstWordObj.word.length) / 2);
    const startY = Math.floor(size / 2);
    
    this.placeWord(grid, firstWordObj, startX, startY, "H", placedWords);

    // Tenta posicionar as próximas palavras
    for (let i = 1; i < words.length; i++) {
      const wordObj = words[i];
      const bestPlacement = this.findBestPlacement(grid, wordObj, placedWords);

      if (bestPlacement) {
        this.placeWord(grid, wordObj, bestPlacement.x, bestPlacement.y, bestPlacement.dir, placedWords);
      }
    }

    return { grid, placedWords };
  }

  // Encontra o melhor ponto de interseção para uma nova palavra
  findBestPlacement(grid, wordObj, placedWords) {
    const size = this.maxSize;
    const targetWord = wordObj.word;
    const placements = [];

    // Para cada palavra já colocada na grade
    for (const placed of placedWords) {
      // Varre as letras da palavra colocada
      for (let pIndex = 0; pIndex < placed.word.length; pIndex++) {
        const pChar = placed.word[pIndex];
        const px = placed.x + (placed.dir === "H" ? pIndex : 0);
        const py = placed.y + (placed.dir === "V" ? pIndex : 0);

        // Varre as letras da nova palavra procurando correspondência
        for (let tIndex = 0; tIndex < targetWord.length; tIndex++) {
          const tChar = targetWord[tIndex];

          if (pChar === tChar) {
            // Nova direção será perpendicular à da palavra colocada
            const newDir = placed.dir === "H" ? "V" : "H";
            const newX = px - (newDir === "H" ? tIndex : 0);
            const newY = py - (newDir === "V" ? tIndex : 0);

            // Verifica se a colocação é válida (limites e colisões)
            if (this.isValidPlacement(grid, targetWord, newX, newY, newDir)) {
              const score = this.calculatePlacementScore(grid, targetWord, newX, newY, newDir, placedWords);
              placements.push({ x: newX, y: newY, dir: newDir, score });
            }
          }
        }
      }
    }

    if (placements.length === 0) return null;

    // Ordena as posições por score decrescente
    placements.sort((a, b) => b.score - a.score);
    return placements[0];
  }

  // Valida se a palavra cabe nas coordenadas e direção sem colisões inválidas
  isValidPlacement(grid, word, startX, startY, dir) {
    const size = this.maxSize;
    const len = word.length;

    // Verifica limites gerais
    if (startX < 0 || startY < 0) return false;
    if (dir === "H" && startX + len > size) return false;
    if (dir === "V" && startY + len > size) return false;

    // Célula antes do início deve estar vazia
    if (dir === "H") {
      if (startX > 0 && grid[startY][startX - 1] !== null) return false;
    } else {
      if (startY > 0 && grid[startY - 1][startX] !== null) return false;
    }

    // Célula após o fim deve estar vazia
    if (dir === "H") {
      if (startX + len < size && grid[startY][startX + len] !== null) return false;
    } else {
      if (startY + len < size && grid[startY + len][startX] !== null) return false;
    }

    // Varre cada caractere da palavra
    let intersections = 0;
    for (let i = 0; i < len; i++) {
      const x = startX + (dir === "H" ? i : 0);
      const y = startY + (dir === "V" ? i : 0);
      const cell = grid[y][x];

      if (cell !== null) {
        // Se a célula já possui uma letra, deve ser a mesma
        if (cell.char !== word[i]) return false;
        // Não permite sobrepor na mesma direção
        if (cell.dir === dir) return false;
        intersections++;
      } else {
        // Se a célula está vazia, seus vizinhos perpendiculares devem estar vazios
        // para evitar palavras paralelas encostadas
        if (dir === "H") {
          if (y > 0 && grid[y - 1][x] !== null) return false;
          if (y < size - 1 && grid[y + 1][x] !== null) return false;
        } else {
          if (x > 0 && grid[y][x - 1] !== null) return false;
          if (x < size - 1 && grid[y][x + 1] !== null) return false;
        }
      }
    }

    // A palavra deve cruzar com pelo menos outra (exceto a primeira palavra do jogo)
    // No tryBuildGrid, a primeira palavra já foi colocada, logo para as próximas precisa de interseção
    return true;
  }

  // Calcula a pontuação da posição para incentivar grades compactas e cheias de cruzamentos
  calculatePlacementScore(grid, word, startX, startY, dir, placedWords) {
    let intersections = 0;
    const len = word.length;

    // Bounding box atual incluindo a nova palavra
    let minX = startX;
    let maxX = startX + (dir === "H" ? len : 1);
    let minY = startY;
    let maxY = startY + (dir === "V" ? len : 1);

    for (const p of placedWords) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x + (p.dir === "H" ? p.word.length : 1));
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y + (p.dir === "V" ? p.word.length : 1));
    }

    const area = (maxX - minX) * (maxY - minY);

    for (let i = 0; i < len; i++) {
      const x = startX + (dir === "H" ? i : 0);
      const y = startY + (dir === "V" ? i : 0);
      if (grid[y][x] !== null) {
        intersections++;
      }
    }

    // Retorna um score: mais cruzamentos = melhor, menor área = melhor.
    // Damos alto peso para interseções e descontamos o tamanho da área.
    return (intersections * 500) - area;
  }

  // Escreve a palavra na grade virtual
  placeWord(grid, wordObj, startX, startY, dir, placedWords) {
    const word = wordObj.word;
    const len = word.length;
    const wordIndex = placedWords.length;

    for (let i = 0; i < len; i++) {
      const x = startX + (dir === "H" ? i : 0);
      const y = startY + (dir === "V" ? i : 0);

      if (grid[y][x] === null) {
        grid[y][x] = {
          char: word[i],
          dir: dir,
          words: [wordIndex]
        };
      } else {
        // Interseção: adiciona o índice desta palavra à célula existente
        grid[y][x].words.push(wordIndex);
      }
    }

    placedWords.push({
      ...wordObj,
      x: startX,
      y: startY,
      dir: dir,
      index: wordIndex
    });
  }

  // Corta a grade em torno das palavras colocadas e adiciona a numeração
  cropAndNumberGrid(buildResult) {
    const { grid, placedWords } = buildResult;
    const size = this.maxSize;

    // Encontra os limites (bounding box) da grade habitada
    let minX = size, maxX = 0, minY = size, maxY = 0;
    let cellFound = false;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] !== null) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          cellFound = true;
        }
      }
    }

    if (!cellFound) return null;

    // Adiciona uma pequena margem de 1 célula
    minX = Math.max(0, minX - 1);
    maxX = Math.min(size - 1, maxX + 1);
    minY = Math.max(0, minY - 1);
    maxY = Math.min(size - 1, maxY + 1);

    const croppedWidth = maxX - minX + 1;
    const croppedHeight = maxY - minY + 1;

    // Cria a nova grade recortada
    const croppedGrid = Array(croppedHeight).fill(null).map(() => Array(croppedWidth).fill(null));

    // Copia as células para a grade recortada
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (grid[y][x] !== null) {
          croppedGrid[y - minY][x - minX] = {
            char: grid[y][x].char,
            words: grid[y][x].words,
            number: null // Será calculado na numeração
          };
        }
      }
    }

    // Ajusta as coordenadas das palavras colocadas
    const adjustedWords = placedWords.map(w => ({
      ...w,
      x: w.x - minX,
      y: w.y - minY
    }));

    // Determina a numeração sequencial das palavras (Top-Left para Bottom-Right)
    let currentNumber = 1;
    const startCellMap = new Map(); // chave: 'x,y', valor: número sequencial

    // Varre a grade linha por linha para dar numeração coerente
    for (let y = 0; y < croppedHeight; y++) {
      for (let x = 0; x < croppedWidth; x++) {
        // Encontra se alguma palavra começa nesta célula
        const startingHere = adjustedWords.filter(w => w.x === x && w.y === y);
        if (startingHere.length > 0) {
          croppedGrid[y][x].number = currentNumber;
          startingHere.forEach(w => {
            w.number = currentNumber;
          });
          currentNumber++;
        }
      }
    }

    // Atualiza os índices de palavras nas células da grade cortada
    for (let y = 0; y < croppedHeight; y++) {
      for (let x = 0; x < croppedWidth; x++) {
        const cell = croppedGrid[y][x];
        if (cell !== null) {
          // Substitui índices antigos pelo novo número da palavra correspondente
          cell.words = cell.words.map(oldIdx => {
            const wordObj = adjustedWords.find(w => w.index === oldIdx);
            return wordObj ? wordObj.number : null;
          }).filter(n => n !== null);
        }
      }
    }

    return {
      grid: croppedGrid,
      words: adjustedWords,
      width: croppedWidth,
      height: croppedHeight
    };
  }
}

// Exportação para Node/Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CrosswordGenerator };
}
