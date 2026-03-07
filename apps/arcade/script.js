const games = [
    { name: 'TETRIS', icon: '🧩', year: '1984', cost: 1, path: 'jogos/tetris/index.html' },
    { name: 'PONG', icon: '🏓', year: '1972', cost: 1, path: 'jogos/pong/index.html' },
    { name: 'SPACE INVADERS', icon: '👾', year: '1978', cost: 1, path: 'jogos/space-invaders/index.html' },
    { name: 'SNAKE GAME', icon: '🐍', year: '1976', cost: 1, path: 'jogos/snake/index.html' },
    { name: 'POKEMON BATTLE', icon: '⚡', year: '1996', cost: 2, path: 'jogos/pokemon/index.html' },
    { name: 'JOGO DA VELHA', icon: '❌', year: '1975', cost: 1, path: 'jogos/jogo-da-velha/index.html' },
    { name: 'SUDOKU', icon: '🔢', year: '1986', cost: 1, path: 'jogos/sudoku/index.html' },
    { name: 'DOMINÓ', icon: '🎲', year: '1980', cost: 1, path: 'jogos/domino/index.html' },
    { name: 'JOGO DA MEMÓRIA', icon: '🎴', year: '1985', cost: 1, path: 'jogos/memoria/index.html' },
    { name: 'TERMO', icon: '📝', year: '2021', cost: 1, path: 'jogos/termo/index.html' },
    { name: '2048', icon: '🌀', year: '2014', cost: 1, path: 'jogos/2048/index.html' },
    { name: 'Quack Quack', icon: '🦆', year: '2014', cost: 1, path: 'jogos/dino/index.html' }
];

let credits = 3;
const SENHA = 'drakon267';

function initArcade() {
    credits = 3;
    console.log('Arcade iniciado com', credits, 'créditos');
    renderGames();
    updateCreditDisplay();
    setupCreditSystem();
    setupAccessibility();
}

function renderGames() {
    const grid = document.getElementById('gamesGrid');
    if (!grid) {
        console.error('Grid não encontrado!');
        return;
    }
    
    grid.innerHTML = '';

    games.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = `game-card ${credits < game.cost ? 'locked' : ''}`;
        card.dataset.index = index;
        card.dataset.cost = game.cost;
        card.setAttribute('role', 'gridcell');
        card.setAttribute('tabindex', credits < game.cost ? '-1' : '0');
        card.setAttribute('aria-label', `${game.name}, lançado em ${game.year}, custa ${game.cost} crédito${game.cost > 1 ? 's' : ''}`);

        card.innerHTML = `
            <span class="game-icon" aria-hidden="true">${game.icon}</span>
            <span class="game-title">${game.name}</span>
            <span class="game-year">${game.year}</span>
            <span class="game-cost" aria-label="Custo: ${game.cost} créditos">${game.cost} CRÉDITO${game.cost > 1 ? 'S' : ''}</span>
        `;

        card.addEventListener('click', () => playGame(index));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playGame(index);
            }
        });

        grid.appendChild(card);
    });
}

function playGame(index) {
    const game = games[index];
    
    if (credits < game.cost) {
        showMessage(`❌ CRÉDITOS INSUFICIENTES! PRECISA DE ${game.cost} CRÉDITO${game.cost > 1 ? 'S' : ''}`, 'error');
        return;
    }

    credits -= game.cost;
    updateCreditDisplay();
    
    showMessage(`✅ ${game.name} INICIADO! ${game.cost} CRÉDITO${game.cost > 1 ? 'S' : ''} CONSUMIDO${game.cost > 1 ? 'S' : ''}`, 'success');
    
    setTimeout(() => {
        window.location.href = game.path;
    }, 1500);
}

function setupCreditSystem() {
    const passwordInput = document.getElementById('creditPassword');
    const addButton = document.getElementById('addCredits');
    const messageDiv = document.getElementById('creditMessage');

    if (!passwordInput || !addButton || !messageDiv) {
        console.error('Elementos do sistema de créditos não encontrados');
        return;
    }

    addButton.addEventListener('click', () => {
        const senha = passwordInput.value.trim();
        
        if (senha === SENHA) {
            credits += 3;
            updateCreditDisplay();
            showMessage(`✅ +3 CRÉDITOS ADICIONADOS! TOTAL: ${credits}`, 'success');
            passwordInput.value = '';
        } else {
            showMessage('❌ SENHA INCORRETA! TENTE NOVAMENTE.', 'error');
            passwordInput.value = '';
        }
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addButton.click();
        }
    });
}

function setupAccessibility() {
    const passwordInput = document.getElementById('creditPassword');
    if (!passwordInput) return;
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            passwordInput.focus();
        }
    });
}

function updateCreditDisplay() {
    const creditValue = document.getElementById('creditCount');
    const creditsRemaining = document.getElementById('creditsRemaining');
    
    if (creditValue) {
        creditValue.textContent = String(credits).padStart(2, '0');
    }
    
    if (creditsRemaining) {
        creditsRemaining.textContent = `${credits} CRÉDITO${credits !== 1 ? 'S' : ''} RESTANTE${credits !== 1 ? 'S' : ''}`;
    }
    
    document.querySelectorAll('.game-card').forEach((card, index) => {
        const gameCost = games[index].cost;
        if (credits < gameCost) {
            card.classList.add('locked');
            card.setAttribute('aria-disabled', 'true');
            card.setAttribute('tabindex', '-1');
        } else {
            card.classList.remove('locked');
            card.setAttribute('aria-disabled', 'false');
            card.setAttribute('tabindex', '0');
        }
    });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('creditMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = text;
    messageDiv.className = `credit-message ${type}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'credit-message';
    }, 3000);
}

document.getElementById('minimize')?.addEventListener('click', () => {
    const gamesGrid = document.querySelector('.games-grid');
    if (gamesGrid) {
        gamesGrid.style.display = 'none';
        showMessage('🕹️ JANELA MINIMIZADA', 'info');
        setTimeout(() => {
            gamesGrid.style.display = 'grid';
        }, 5000);
    }
});

document.getElementById('maximize')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        showMessage('🕹️ MODO TELA CHEIA ATIVADO', 'info');
    } else {
        document.exitFullscreen();
        showMessage('🕹️ MODO TELA CHEIA DESATIVADO', 'info');
    }
});

document.getElementById('close')?.addEventListener('click', () => {
    window.parent.postMessage('closeApp', '*');
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando arcade...');
    initArcade();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initArcade, 100);
}