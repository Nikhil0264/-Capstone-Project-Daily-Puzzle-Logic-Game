import { generateDailySeed } from "../seed";
import { createSeededRandom } from "../random";

export function generatePuzzle(difficulty = "easy") {
  const seed = generateDailySeed();
  const random = createSeededRandom(seed);

  let size;
  let hideProbability;
  switch(difficulty){
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
      const val = Math.floor(random() * 2); // FIXED
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

  return {
        id: seed + "-" + difficulty,
        difficulty,
        solution,
        grid,
  };
}
