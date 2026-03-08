const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 450;
canvas.height = 450;

let board = [];
let initialBoard = [];
let selectedCell = { row: -1, col: -1 };
let errors = 0;
const MAX_ERRORS = 3;
let hintsRemaining = 3;
let timerSeconds = 0;
let timerInterval = null;
let gameActive = false;
let gameCompleted = false;
let currentDifficulty = 'easy';

const difficultySettings = {
    easy: { cellsToRemove: 30 },
    medium: { cellsToRemove: 40 },
    hard: { cellsToRemove: 50 },
    expert: { cellsToRemove: 60 }
};

const timerSpan = document.getElementById('timer');
const errorsSpan = document.getElementById('errors');
const hintsSpan = document.getElementById('hints');
const victoryScreen = document.getElementById('victoryScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const victoryTime = document.getElementById('victoryTime');
const victoryErrors = document.getElementById('victoryErrors');
const gameOverTime = document.getElementById('gameOverTime');
const victoryRestartBtn = document.getElementById('victoryRestartBtn');
const gameOverRestartBtn = document.getElementById('gameOverRestartBtn');
const newGameBtn = document.getElementById('newGameBtn');
const hintBtn = document.getElementById('hintBtn');
const checkBtn = document.getElementById('checkBtn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const numBtns = document.querySelectorAll('.num-btn');
const toastMessage = document.getElementById('toastMessage');
const toastText = document.getElementById('toastText');

function showToast(text, isError = false) {
    toastText.textContent = text;
    toastMessage.style.borderColor = isError ? '#ff0000' : '#ffff00';
    toastMessage.style.background = isError ? '#6a2a2a' : '#2a4a6a';
    toastMessage.classList.remove('hidden');
    setTimeout(() => {
        toastMessage.classList.add('hidden');
    }, 2000);
}

function generateFullBoard() {
    const board = Array(9).fill().map(() => Array(9).fill(0));
    
    function isValid(board, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num || board[x][col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        return true;
    }
    
    function solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    for (let i = nums.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [nums[i], nums[j]] = [nums[j], nums[i]];
                    }
                    for (let num of nums) {
                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (solve(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    
    solve(board);
    return board;
}

function removeCells(board, count) {
    const newBoard = board.map(row => [...row]);
    let removed = 0;
    while (removed < count) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        if (newBoard[row][col] !== 0) {
            newBoard[row][col] = 0;
            removed++;
        }
    }
    return newBoard;
}

function newGame() {
    const fullBoard = generateFullBoard();
    initialBoard = removeCells(fullBoard, difficultySettings[currentDifficulty].cellsToRemove);
    board = initialBoard.map(row => [...row]);
    selectedCell = { row: -1, col: -1 };
    errors = 0;
    hintsRemaining = 3;
    gameActive = true;
    gameCompleted = false;
    errorsSpan.textContent = `${errors}/${MAX_ERRORS}`;
    hintsSpan.textContent = hintsRemaining;
    victoryScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (timerInterval) clearInterval(timerInterval);
    timerSeconds = 0;
    timerSpan.textContent = '00:00';
    timerInterval = setInterval(() => {
        if (gameActive && !gameCompleted) {
            timerSeconds++;
            const mins = Math.floor(timerSeconds / 60);
            const secs = timerSeconds % 60;
            timerSpan.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }, 1000);
    drawBoard();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cellSize = canvas.width / 9;
    
    for (let i = 0; i <= 9; i++) {
        ctx.lineWidth = i % 3 === 0 ? 3 : 1;
        ctx.strokeStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== 0) {
                ctx.font = 'bold 32px "Courier New"';
                ctx.fillStyle = initialBoard[row][col] !== 0 ? '#00ffff' : '#ffff00';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    board[row][col],
                    col * cellSize + cellSize / 2,
                    row * cellSize + cellSize / 2
                );
            }
        }
    }
    
    if (selectedCell.row >= 0 && selectedCell.col >= 0) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.strokeRect(
            selectedCell.col * cellSize + 2,
            selectedCell.row * cellSize + 2,
            cellSize - 4,
            cellSize - 4
        );
    }
}

function isValidMove(row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num || board[x][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[boxRow + i][boxCol + j] === num) return false;
        }
    }
    return true;
}

function checkBoard() {
    if (!gameActive || gameCompleted) return;
    
    let hasError = false;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== 0 && !isValidMove(row, col, board[row][col])) {
                hasError = true;
            }
        }
    }
    
    if (!hasError) {
        let completed = true;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) completed = false;
            }
        }
        if (completed) {
            gameCompleted = true;
            const mins = Math.floor(timerSeconds / 60);
            const secs = timerSeconds % 60;
            victoryTime.textContent = `Tempo: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            victoryErrors.textContent = `Erros: ${errors}`;
            victoryScreen.classList.remove('hidden');
            showToast('🏆 PARABÉNS! VOCÊ VENCEU!');
        }
    }
}

canvas.addEventListener('click', (e) => {
    if (!gameActive || gameCompleted) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(x / (canvas.width / 9));
    const row = Math.floor(y / (canvas.height / 9));
    
    if (initialBoard[row][col] === 0) {
        selectedCell = { row, col };
        drawBoard();
    }
});

numBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!gameActive || gameCompleted || selectedCell.row < 0) {
            showToast('Selecione uma célula primeiro!', true);
            return;
        }
        
        const num = parseInt(btn.dataset.num);
        const row = selectedCell.row;
        const col = selectedCell.col;
        
        if (num === 0) {
            board[row][col] = 0;
            drawBoard();
            checkBoard();
            return;
        }
        
        if (board[row][col] === num) {
            board[row][col] = 0;
            drawBoard();
            checkBoard();
            return;
        }
        
        const isValid = isValidMove(row, col, num);
        board[row][col] = num;
        
        if (!isValid) {
            errors++;
            errorsSpan.textContent = `${errors}/${MAX_ERRORS}`;
            showToast(`❌ Erro! ${errors}/${MAX_ERRORS}`, true);
            
            if (errors >= MAX_ERRORS) {
                gameActive = false;
                const mins = Math.floor(timerSeconds / 60);
                const secs = timerSeconds % 60;
                gameOverTime.textContent = `Tempo: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                gameOverScreen.classList.remove('hidden');
                showToast('💀 GAME OVER!', true);
            }
        }
        
        drawBoard();
        checkBoard();
    });
});

document.addEventListener('keydown', (e) => {
    if (!gameActive || gameCompleted) return;
    
    const key = e.key;
    
    if (selectedCell.row < 0) {
        showToast('Selecione uma célula primeiro!', true);
        return;
    }
    
    const row = selectedCell.row;
    const col = selectedCell.col;
    
    if (key >= '1' && key <= '9') {
        const num = parseInt(key);
        
        if (board[row][col] === num) {
            board[row][col] = 0;
            drawBoard();
            checkBoard();
            return;
        }
        
        const isValid = isValidMove(row, col, num);
        board[row][col] = num;
        
        if (!isValid) {
            errors++;
            errorsSpan.textContent = `${errors}/${MAX_ERRORS}`;
            showToast(`❌ Erro! ${errors}/${MAX_ERRORS}`, true);
            
            if (errors >= MAX_ERRORS) {
                gameActive = false;
                const mins = Math.floor(timerSeconds / 60);
                const secs = timerSeconds % 60;
                gameOverTime.textContent = `Tempo: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                gameOverScreen.classList.remove('hidden');
                showToast('💀 GAME OVER!', true);
            }
        }
        
        drawBoard();
        checkBoard();
    }
    
    if (key === 'Delete' || key === 'Backspace') {
        board[row][col] = 0;
        drawBoard();
        checkBoard();
    }
    
    if (key === 'ArrowUp' && selectedCell.row > 0) {
        selectedCell.row--;
        if (initialBoard[selectedCell.row][selectedCell.col] !== 0) {
            selectedCell.row++;
        }
        drawBoard();
    }
    
    if (key === 'ArrowDown' && selectedCell.row < 8) {
        selectedCell.row++;
        if (initialBoard[selectedCell.row][selectedCell.col] !== 0) {
            selectedCell.row--;
        }
        drawBoard();
    }
    
    if (key === 'ArrowLeft' && selectedCell.col > 0) {
        selectedCell.col--;
        if (initialBoard[selectedCell.row][selectedCell.col] !== 0) {
            selectedCell.col++;
        }
        drawBoard();
    }
    
    if (key === 'ArrowRight' && selectedCell.col < 8) {
        selectedCell.col++;
        if (initialBoard[selectedCell.row][selectedCell.col] !== 0) {
            selectedCell.col--;
        }
        drawBoard();
    }
});

hintBtn.addEventListener('click', () => {
    if (!gameActive || gameCompleted) return;
    
    if (hintsRemaining <= 0) {
        showToast('❌ Sem dicas restantes!', true);
        return;
    }
    
    if (selectedCell.row < 0) {
        showToast('Selecione uma célula primeiro!', true);
        return;
    }
    
    if (board[selectedCell.row][selectedCell.col] !== 0) {
        showToast('Esta célula já está preenchida!', true);
        return;
    }
    
    for (let num = 1; num <= 9; num++) {
        if (isValidMove(selectedCell.row, selectedCell.col, num)) {
            board[selectedCell.row][selectedCell.col] = num;
            hintsRemaining--;
            hintsSpan.textContent = hintsRemaining;
            drawBoard();
            checkBoard();
            showToast(`💡 Dica usada! ${hintsRemaining} restantes`);
            return;
        }
    }
});

checkBtn.addEventListener('click', () => {
    if (!gameActive || gameCompleted) return;
    
    let conflictCount = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== 0 && !isValidMove(row, col, board[row][col])) {
                conflictCount++;
            }
        }
    }
    
    if (conflictCount > 0) {
        showToast(`⚠️ Encontrados ${conflictCount} conflitos!`, true);
    } else {
        showToast('✅ Nenhum erro encontrado!');
    }
});

difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
        newGame();
    });
});

newGameBtn.addEventListener('click', newGame);

victoryRestartBtn.addEventListener('click', () => {
    victoryScreen.classList.add('hidden');
    newGame();
});

gameOverRestartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    newGame();
});

document.getElementById('backToArcade').addEventListener('click', () => {
    window.location.href = '../index.html';
});

newGame();