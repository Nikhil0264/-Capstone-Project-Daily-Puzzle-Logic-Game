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

export function generatePuzzle(difficulty = "easy", type = "binary", date = null) {
  const seed = generateDailySeed(date);

  let puzzleData;
  if (type === 'sudoku') {
    puzzleData = generateSudoku(seed, difficulty);
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
