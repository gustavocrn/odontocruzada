import { WordItem } from "@/data/database";

export interface PlacedWord extends WordItem {
  x: number;
  y: number;
  dir: "H" | "V";
  index: number;
  number: number;
}

export interface GridCell {
  char: string;
  dir: "H" | "V";
  words: number[];
  number: number | null;
}

export interface GeneratorResult {
  grid: (GridCell | null)[][];
  words: PlacedWord[];
  width: number;
  height: number;
}

interface TempPlacedWord extends WordItem {
  x: number;
  y: number;
  dir: "H" | "V";
  index: number;
  word: string;
  original: string;
}

interface TempCell {
  char: string;
  dir: "H" | "V";
  words: number[];
}

export class CrosswordGenerator {
  private maxSize: number;

  constructor(maxSize = 30) {
    this.maxSize = maxSize;
  }

  normalize(word: string): string {
    return word
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  generate(wordList: WordItem[]): GeneratorResult | null {
    if (!wordList || wordList.length === 0) return null;

    const preparedWords = wordList
      .map((w, index) => ({
        original: w.word,
        word: this.normalize(w.word),
        clue: w.clue,
        explanation: w.explanation,
        originalIndex: index,
      }))
      .filter((w) => w.word.length >= 2);

    const sortedWords = [...preparedWords].sort(
      (a, b) => b.word.length - a.word.length
    );

    let bestResult: { grid: (TempCell | null)[][]; placedWords: TempPlacedWord[] } | null = null;
    let bestPlacedCount = -1;

    const totalAttempts = 20;
    for (let attempt = 0; attempt < totalAttempts; attempt++) {
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

        if (bestPlacedCount === sortedWords.length) {
          break;
        }
      }
    }

    if (!bestResult) return null;

    return this.cropAndNumberGrid(bestResult);
  }

  private tryBuildGrid(words: { original: string; word: string; clue: string; explanation: string; originalIndex: number }[]) {
    const size = this.maxSize;
    const grid: (TempCell | null)[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));
    const placedWords: TempPlacedWord[] = [];

    const firstWordObj = words[0];
    const startX = Math.floor((size - firstWordObj.word.length) / 2);
    const startY = Math.floor(size / 2);

    this.placeWord(grid, firstWordObj, startX, startY, "H", placedWords);

    for (let i = 1; i < words.length; i++) {
      const wordObj = words[i];
      const bestPlacement = this.findBestPlacement(grid, wordObj, placedWords);

      if (bestPlacement) {
        this.placeWord(
          grid,
          wordObj,
          bestPlacement.x,
          bestPlacement.y,
          bestPlacement.dir,
          placedWords
        );
      }
    }

    return { grid, placedWords };
  }

  private findBestPlacement(
    grid: (TempCell | null)[][],
    wordObj: { word: string; clue: string; explanation: string },
    placedWords: TempPlacedWord[]
  ) {
    const targetWord = wordObj.word;
    const placements: { x: number; y: number; dir: "H" | "V"; score: number }[] = [];

    for (const placed of placedWords) {
      for (let pIndex = 0; pIndex < placed.word.length; pIndex++) {
        const pChar = placed.word[pIndex];
        const px = placed.x + (placed.dir === "H" ? pIndex : 0);
        const py = placed.y + (placed.dir === "V" ? pIndex : 0);

        for (let tIndex = 0; tIndex < targetWord.length; tIndex++) {
          const tChar = targetWord[tIndex];

          if (pChar === tChar) {
            const newDir = placed.dir === "H" ? "V" : "H";
            const newX = px - (newDir === "H" ? tIndex : 0);
            const newY = py - (newDir === "V" ? tIndex : 0);

            if (this.isValidPlacement(grid, targetWord, newX, newY, newDir)) {
              const score = this.calculatePlacementScore(
                grid,
                targetWord,
                newX,
                newY,
                newDir,
                placedWords
              );
              placements.push({ x: newX, y: newY, dir: newDir, score });
            }
          }
        }
      }
    }

    if (placements.length === 0) return null;

    placements.sort((a, b) => b.score - a.score);
    return placements[0];
  }

  private isValidPlacement(
    grid: (TempCell | null)[][],
    word: string,
    startX: number,
    startY: number,
    dir: "H" | "V"
  ): boolean {
    const size = this.maxSize;
    const len = word.length;

    if (startX < 0 || startY < 0) return false;
    if (dir === "H" && startX + len > size) return false;
    if (dir === "V" && startY + len > size) return false;

    if (dir === "H") {
      if (startX > 0 && grid[startY][startX - 1] !== null) return false;
    } else {
      if (startY > 0 && grid[startY - 1][startX] !== null) return false;
    }

    if (dir === "H") {
      if (startX + len < size && grid[startY][startX + len] !== null) return false;
    } else {
      if (startY + len < size && grid[startY + len][startX] !== null) return false;
    }

    for (let i = 0; i < len; i++) {
      const x = startX + (dir === "H" ? i : 0);
      const y = startY + (dir === "V" ? i : 0);
      const cell = grid[y][x];

      if (cell !== null) {
        if (cell.char !== word[i]) return false;
        if (cell.dir === dir) return false;
      } else {
        if (dir === "H") {
          if (y > 0 && grid[y - 1][x] !== null) return false;
          if (y < size - 1 && grid[y + 1][x] !== null) return false;
        } else {
          if (x > 0 && grid[y][x - 1] !== null) return false;
          if (x < size - 1 && grid[y][x + 1] !== null) return false;
        }
      }
    }

    return true;
  }

  private calculatePlacementScore(
    grid: (TempCell | null)[][],
    word: string,
    startX: number,
    startY: number,
    dir: "H" | "V",
    placedWords: TempPlacedWord[]
  ): number {
    let intersections = 0;
    const len = word.length;

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

    return intersections * 500 - area;
  }

  private placeWord(
    grid: (TempCell | null)[][],
    wordObj: { original: string; word: string; clue: string; explanation: string },
    startX: number,
    startY: number,
    dir: "H" | "V",
    placedWords: TempPlacedWord[]
  ) {
    const word = wordObj.word;
    const len = word.length;
    const wordIndex = placedWords.length;

    for (let i = 0; i < len; i++) {
      const x = startX + (dir === "H" ? i : 0);
      const y = startY + (dir === "V" ? i : 0);

      const cell = grid[y][x];
      if (cell === null) {
        grid[y][x] = {
          char: word[i],
          dir: dir,
          words: [wordIndex],
        };
      } else {
        cell.words.push(wordIndex);
      }
    }

    placedWords.push({
      ...wordObj,
      x: startX,
      y: startY,
      dir: dir,
      index: wordIndex,
    });
  }

  private cropAndNumberGrid(buildResult: {
    grid: (TempCell | null)[][];
    placedWords: TempPlacedWord[];
  }): GeneratorResult | null {
    const { grid, placedWords } = buildResult;
    const size = this.maxSize;

    let minX = size,
      maxX = 0,
      minY = size,
      maxY = 0;
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

    minX = Math.max(0, minX - 1);
    maxX = Math.min(size - 1, maxX + 1);
    minY = Math.max(0, minY - 1);
    maxY = Math.min(size - 1, maxY + 1);

    const croppedWidth = maxX - minX + 1;
    const croppedHeight = maxY - minY + 1;

    const croppedGrid: (GridCell | null)[][] = Array(croppedHeight)
      .fill(null)
      .map(() => Array(croppedWidth).fill(null));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const cell = grid[y][x];
        if (cell !== null) {
          croppedGrid[y - minY][x - minX] = {
            char: cell.char,
            dir: cell.dir,
            words: cell.words,
            number: null,
          };
        }
      }
    }

    const adjustedWords: PlacedWord[] = placedWords.map((w) => ({
      word: w.word,
      clue: w.clue,
      explanation: w.explanation,
      x: w.x - minX,
      y: w.y - minY,
      dir: w.dir,
      index: w.index,
      number: 0, // Set later during numbering
    }));

    let currentNumber = 1;

    for (let y = 0; y < croppedHeight; y++) {
      for (let x = 0; x < croppedWidth; x++) {
        const startingHere = adjustedWords.filter(
          (w) => w.x === x && w.y === y
        );
        if (startingHere.length > 0) {
          const cell = croppedGrid[y][x];
          if (cell) {
            cell.number = currentNumber;
          }
          startingHere.forEach((w) => {
            w.number = currentNumber;
          });
          currentNumber++;
        }
      }
    }

    for (let y = 0; y < croppedHeight; y++) {
      for (let x = 0; x < croppedWidth; x++) {
        const cell = croppedGrid[y][x];
        if (cell !== null) {
          cell.words = cell.words
            .map((oldIdx) => {
              const wordObj = adjustedWords.find((w) => w.index === oldIdx);
              return wordObj ? wordObj.number : null;
            })
            .filter((n): n is number => n !== null);
        }
      }
    }

    return {
      grid: croppedGrid,
      words: adjustedWords,
      width: croppedWidth,
      height: croppedHeight,
    };
  }
}
