import { createSeededRandom } from "../random";

export function generateSudoku(seed, difficulty) {
    const random = createSeededRandom(seed + "sudoku");
    const size = 4;
    const grid = Array(size).fill().map(() => Array(size).fill(0));

    
    

    
    
    
    
    
    

    
    

    const fillBoard = (board) => {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] === 0) {
                    const nums = [1, 2, 3, 4];
                    
                    for (let i = nums.length - 1; i > 0; i--) {
                        const j = Math.floor(random() * (i + 1));
                        [nums[i], nums[j]] = [nums[j], nums[i]];
                    }

                    for (let num of nums) {
                        if (isValid(board, r, c, num)) {
                            board[r][c] = num;
                            if (fillBoard(board)) return true;
                            board[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    };

    const isValid = (board, r, c, num) => {
        
        for (let i = 0; i < size; i++) {
            if (board[r][i] === num) return false;
            if (board[i][c] === num) return false;
        }
        
        const startR = Math.floor(r / 2) * 2;
        const startC = Math.floor(c / 2) * 2;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                if (board[startR + i][startC + j] === num) return false;
            }
        }
        return true;
    };

    fillBoard(grid);

    
    const solution = grid.map(row => [...row]);

    
    let removeCount = 4; 
    if (difficulty === 'medium') removeCount = 6;
    if (difficulty === 'hard') removeCount = 8;

    const puzzleGrid = grid.map(row => [...row]);

    for (let k = 0; k < removeCount; k++) {
        let r = Math.floor(random() * size);
        let c = Math.floor(random() * size);
        while (puzzleGrid[r][c] === "") {
            r = Math.floor(random() * size);
            c = Math.floor(random() * size);
        }
        puzzleGrid[r][c] = "";
    }

    return {
        solution,
        grid: puzzleGrid,
        type: 'sudoku'
    };
}
