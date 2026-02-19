import { generateDailySeed } from "../seed";
import { createSeededRandom } from "../random";
import { generateSudoku } from "./sudoku";

function generateBinary(seed, difficulty) {
  const random = createSeededRandom(seed);
  let size;
  let hideProbability;
  switch (difficulty) {
    case "medium":
      size = 6;
      hideProbability = 0.4;
      break;
    case "hard":
      size = 8;
      hideProbability = 0.5;
      break;
    default:
      size = 4;
      hideProbability = 0.3;
  }
  const solution = [];
  const grid = [];

  for (let i = 0; i < size; i++) {
    let solRow = [];
    let gridRow = [];

    for (let j = 0; j < size; j++) {
      const val = Math.floor(random() * 2);
      solRow.push(val);

      if (random() < hideProbability) {
        gridRow.push("");
      } else {
        gridRow.push(val);
      }
    }

    solution.push(solRow);
    grid.push(gridRow);
  }

  return { solution, grid, type: 'binary' };
}

function generateLights(seed, difficulty) {
  const random = createSeededRandom(seed + "lights");
  let size = 3;
  let hideProbability = 0.4;
  if (difficulty === 'medium') { size = 4; hideProbability = 0.45; }
  if (difficulty === 'hard') { size = 5; hideProbability = 0.5; }

  const solution = [];
  const grid = [];
  for (let r = 0; r < size; r++) {
    const solRow = [];
    const gridRow = [];
    for (let c = 0; c < size; c++) {
      const val = Math.floor(random() * 2);
      solRow.push(val);
      gridRow.push(random() < hideProbability ? "" : val);
    }
    solution.push(solRow);
    grid.push(gridRow);
  }

  return { solution, grid, type: 'lights' };
}

function generatePairs(seed, difficulty) {
  const random = createSeededRandom(seed + "pairs");
  let size = 4; // 4x4 -> 8 pairs
  if (difficulty === 'medium') size = 6; // 18 pairs (36 cells)
  if (difficulty === 'hard') size = 8; // 32 pairs

  const total = size * size;
  const pairs = [];
  for (let i = 0; i < total / 2; i++) pairs.push(i + 1);
  const pool = [...pairs, ...pairs];

  // shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const solution = [];
  const grid = [];
  let idx = 0;
  for (let r = 0; r < size; r++) {
    const solRow = [];
    const gridRow = [];
    for (let c = 0; c < size; c++) {
      solRow.push(pool[idx]);
      // hide most values; show a few depending on difficulty
      const revealChance = difficulty === 'hard' ? 0.02 : difficulty === 'medium' ? 0.05 : 0.1;
      gridRow.push(random() < revealChance ? pool[idx] : "");
      idx++;
    }
    solution.push(solRow);
    grid.push(gridRow);
  }

  return { solution, grid, type: 'pairs' };
}

export function generatePuzzle(difficulty = "easy", type = "binary", date = null) {
  const seed = generateDailySeed(date);

  let puzzleData;
  if (type === 'sudoku') {
    puzzleData = generateSudoku(seed, difficulty);
  } else if (type === 'lights') {
    puzzleData = generateLights(seed, difficulty);
  } else if (type === 'pairs') {
    puzzleData = generatePairs(seed, difficulty);
  } else {
    puzzleData = generateBinary(seed, difficulty);
  }

  return {
    id: seed + "-" + difficulty + "-" + type,
    difficulty,
    type: puzzleData.type,
    solution: puzzleData.solution,
    grid: puzzleData.grid,
  };
}
