export function validateGrid(grid, solution) {
  return JSON.stringify(grid) === JSON.stringify(solution);
}
